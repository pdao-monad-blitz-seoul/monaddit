use alloy::{
    primitives::{Address, B256, U256},
    providers::{Provider, ProviderBuilder, WsConnect},
    pubsub::PubSubFrontend,
    rpc::types::eth::{BlockNumberOrTag, Filter},
};
use futures_util::StreamExt;
use std::str::FromStr;
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use crate::chain::contracts::*;
use crate::config::Config;
use crate::db::Database;
use crate::models::{ChainEvent, Content, ContentStatus};
use anyhow::Result;

pub struct EventListener {
    db: Database,
    config: Config,
    shutdown_tx: mpsc::Sender<()>,
    shutdown_rx: mpsc::Receiver<()>,
}

impl EventListener {
    pub fn new(db: Database, config: Config) -> Self {
        let (shutdown_tx, shutdown_rx) = mpsc::channel(1);
        Self {
            db,
            config,
            shutdown_tx,
            shutdown_rx,
        }
    }

    pub async fn start(&mut self) -> Result<()> {
        info!("Starting blockchain event listener");

        // Connect to WebSocket provider for event subscriptions
        let ws_url = self.config.rpc_url.replace("http", "ws");
        let ws = WsConnect::new(ws_url);
        let provider = ProviderBuilder::new().on_ws(ws).await?;

        // Create filters for each contract
        let content_registry_address: Address = self.config.content_registry_address.parse()?;
        let staking_vault_address: Address = self.config.staking_vault_address.parse()?;
        let moderation_game_address: Address = self.config.moderation_game_address.parse()?;

        // Subscribe to ContentRegistry events
        let content_filter = Filter::new()
            .address(content_registry_address)
            .from_block(BlockNumberOrTag::Latest);

        let mut content_stream = provider.subscribe_logs(&content_filter).await?;

        // Subscribe to StakingVault events
        let staking_filter = Filter::new()
            .address(staking_vault_address)
            .from_block(BlockNumberOrTag::Latest);

        let mut staking_stream = provider.subscribe_logs(&staking_filter).await?;

        // Subscribe to ModerationGame events
        let moderation_filter = Filter::new()
            .address(moderation_game_address)
            .from_block(BlockNumberOrTag::Latest);

        let mut moderation_stream = provider.subscribe_logs(&moderation_filter).await?;

        info!("Event listener started, waiting for events...");

        loop {
            tokio::select! {
                Some(log) = content_stream.next() => {
                    if let Err(e) = self.handle_content_registry_event(log).await {
                        error!("Error handling ContentRegistry event: {}", e);
                    }
                }
                Some(log) = staking_stream.next() => {
                    if let Err(e) = self.handle_staking_vault_event(log).await {
                        error!("Error handling StakingVault event: {}", e);
                    }
                }
                Some(log) = moderation_stream.next() => {
                    if let Err(e) = self.handle_moderation_game_event(log).await {
                        error!("Error handling ModerationGame event: {}", e);
                    }
                }
                _ = self.shutdown_rx.recv() => {
                    info!("Shutting down event listener");
                    break;
                }
            }
        }

        Ok(())
    }

    async fn handle_content_registry_event(&self, log: alloy::rpc::types::Log) -> Result<()> {
        // Try to decode as ContentPublished event
        if let Ok(event) = ContentRegistry::ContentPublished::decode_log(&log, true) {
            info!(
                "ContentPublished event: contentId={}, author={}, hash={}",
                event.contentId,
                event.author,
                event.contentHash
            );

            // Update content status in database
            self.db
                .update_content_status(event.contentId, ContentStatus::Published)
                .await?;

            // Store event in chain_events table
            self.db
                .store_chain_event(ChainEvent {
                    id: uuid::Uuid::new_v4(),
                    block_number: log.block_number.unwrap_or_default() as i64,
                    transaction_hash: format!("{:?}", log.transaction_hash.unwrap_or_default()),
                    event_type: "ContentPublished".to_string(),
                    contract_address: format!("{:?}", log.address),
                    data: serde_json::json!({
                        "contentId": event.contentId.to_string(),
                        "author": format!("{:?}", event.author),
                        "contentHash": format!("{:?}", event.contentHash),
                    }),
                    processed: true,
                    created_at: chrono::Utc::now(),
                    processed_at: Some(chrono::Utc::now()),
                })
                .await?;
        }

        // Try to decode as ContentChallenged event
        if let Ok(event) = ContentRegistry::ContentChallenged::decode_log(&log, true) {
            info!(
                "ContentChallenged event: contentId={}, challenger={}, reason={}",
                event.contentId, event.challenger, event.reason
            );

            // Update content status
            self.db
                .update_content_status(event.contentId, ContentStatus::Challenged)
                .await?;

            // Store challenge in database
            self.db
                .create_challenge(
                    event.contentId,
                    format!("{:?}", event.challenger),
                    event.reason,
                    None, // evidence will be updated separately
                )
                .await?;
        }

        // Try to decode as ChallengeResolved event
        if let Ok(event) = ContentRegistry::ChallengeResolved::decode_log(&log, true) {
            info!(
                "ChallengeResolved event: contentId={}, guilty={}, slashed={}",
                event.contentId, event.guilty, event.slashedAmount
            );

            // Update content status
            self.db
                .update_content_status(event.contentId, ContentStatus::Resolved)
                .await?;

            // Update challenge resolution
            self.db
                .resolve_challenge(event.contentId, event.guilty)
                .await?;
        }

        Ok(())
    }

    async fn handle_staking_vault_event(&self, log: alloy::rpc::types::Log) -> Result<()> {
        // Try to decode as Deposited event
        if let Ok(event) = StakingVault::Deposited::decode_log(&log, true) {
            info!(
                "Deposited event: user={}, amount={}",
                event.user, event.amount
            );

            // Update user stake in database
            self.db
                .update_user_stake(format!("{:?}", event.user), event.amount)
                .await?;
        }

        // Try to decode as Slashed event
        if let Ok(event) = StakingVault::Slashed::decode_log(&log, true) {
            warn!(
                "Slashed event: user={}, amount={}, reason={}",
                event.user, event.amount, event.reason
            );

            // Record slashing event
            self.db
                .record_slashing(
                    format!("{:?}", event.user),
                    event.amount,
                    event.reason,
                )
                .await?;
        }

        Ok(())
    }

    async fn handle_moderation_game_event(&self, log: alloy::rpc::types::Log) -> Result<()> {
        // Try to decode as DisputeInitialized event
        if let Ok(event) = ModerationGame::DisputeInitialized::decode_log(&log, true) {
            info!(
                "DisputeInitialized: disputeId={}, contentId={}, challenger={}",
                event.disputeId, event.contentId, event.challenger
            );

            // Update content status to disputed
            self.db
                .update_content_status(event.contentId, ContentStatus::Disputed)
                .await?;
        }

        // Try to decode as DisputeResolved event
        if let Ok(event) = ModerationGame::DisputeResolved::decode_log(&log, true) {
            info!(
                "DisputeResolved: disputeId={}, guilty={}, guiltyVotes={}, notGuiltyVotes={}",
                event.disputeId, event.guilty, event.guiltyVotes, event.notGuiltyVotes
            );

            // Record dispute resolution
            self.db
                .record_dispute_resolution(
                    event.disputeId,
                    event.guilty,
                    event.guiltyVotes,
                    event.notGuiltyVotes,
                )
                .await?;
        }

        Ok(())
    }

    pub fn shutdown(&self) {
        let _ = self.shutdown_tx.try_send(());
    }
}