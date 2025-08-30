use alloy::{
    primitives::{Address, B256, U256},
    providers::{Provider, ProviderBuilder, RootProvider},
    rpc::client::RpcClient,
    transports::http::{Client, Http},
};
use std::sync::Arc;

use crate::chain::contracts::*;
use crate::config::Config;
use anyhow::Result;

#[derive(Clone)]
pub struct ChainClient {
    provider: Arc<RootProvider<Http<Client>>>,
    config: Config,
}

impl ChainClient {
    pub async fn new(config: Config) -> Result<Self> {
        // Create read-only provider (no wallet needed)
        let provider = ProviderBuilder::new()
            .on_http(config.rpc_url.parse()?);

        Ok(Self {
            provider: Arc::new(provider),
            config,
        })
    }

    pub fn provider(&self) -> &Arc<RootProvider<Http<Client>>> {
        &self.provider
    }

    // Read-only functions for querying blockchain data
    // Note: All write operations (publish, challenge, etc.) are done by users directly from frontend

    pub async fn get_content_info(
        &self,
        content_id: U256,
    ) -> Result<ContentInfo> {
        let contract = ContentRegistry::new(
            self.config.content_registry_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.getContent(content_id).call().await?;

        Ok(ContentInfo {
            author: result.author,
            content_hash: result.contentHash,
            uri: result.uri,
            bond: result.bond,
            published_at: result.publishedAt,
            lock_until: result.lockUntil,
            status: result.status,
        })
    }

    pub async fn can_withdraw_bond(&self, content_id: U256) -> Result<bool> {
        let contract = ContentRegistry::new(
            self.config.content_registry_address.parse()?,
            self.provider.clone(),
        );

        let can_withdraw = contract.canWithdrawBond(content_id).call().await?;
        Ok(can_withdraw.canWithdrawBond)
    }

    // Staking Vault functions
    pub async fn get_stake_info(&self, user: Address) -> Result<StakeInfo> {
        let contract = StakingVault::new(
            self.config.staking_vault_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.getStakeInfo(user).call().await?;

        Ok(StakeInfo {
            total_amount: result.totalAmount,
            available: result.available,
            locked: result.locked,
            staked_at: result.stakedAt,
            stake_age: result.stakeAge,
        })
    }

    pub async fn is_eligible_staker(&self, user: Address) -> Result<bool> {
        let contract = StakingVault::new(
            self.config.staking_vault_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.isEligibleStaker(user).call().await?;
        Ok(result.isEligibleStaker)
    }

    // Reputation SBT functions
    pub async fn get_reputation(&self, user: Address) -> Result<(U256, U256)> {
        let contract = ReputationSBT::new(
            self.config.reputation_sbt_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.getReputation(user).call().await?;
        Ok((result.karma, result.disputeRate))
    }

    pub async fn get_reputation_multiplier(&self, user: Address) -> Result<U256> {
        let contract = ReputationSBT::new(
            self.config.reputation_sbt_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.getReputationMultiplier(user).call().await?;
        Ok(result.getReputationMultiplier)
    }

    // Staking Rewards functions
    pub async fn get_pending_rewards(&self, user: Address) -> Result<U256> {
        let contract = StakingRewards::new(
            self.config.staking_rewards_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.getPendingRewards(user).call().await?;
        Ok(result.getPendingRewards)
    }

    pub async fn is_eligible_for_rewards(&self, user: Address) -> Result<bool> {
        let contract = StakingRewards::new(
            self.config.staking_rewards_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.isEligible(user).call().await?;
        Ok(result.isEligible)
    }

    // MDT Token functions
    pub async fn get_mdt_balance(&self, user: Address) -> Result<U256> {
        let contract = MdtToken::new(
            self.config.mdt_token_address.parse()?,
            self.provider.clone(),
        );

        let result = contract.balanceOf(user).call().await?;
        Ok(result.balanceOf)
    }
}

#[derive(Debug, Clone)]
pub struct ContentInfo {
    pub author: Address,
    pub content_hash: B256,
    pub uri: String,
    pub bond: U256,
    pub published_at: U256,
    pub lock_until: U256,
    pub status: u8,
}

#[derive(Debug, Clone)]
pub struct StakeInfo {
    pub total_amount: U256,
    pub available: U256,
    pub locked: U256,
    pub staked_at: U256,
    pub stake_age: U256,
}