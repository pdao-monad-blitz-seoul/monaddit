"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useMonaddit, useBackendAPI } from "~~/hooks/useMonaddit";
import { keccak256, toBytes } from "viem";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Shield,
  Award,
  TrendingUp,
  Clock,
  Flame,
  Users,
  AlertCircle,
  Coins,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Mock data - replace with actual blockchain data
const mockPosts = [
  {
    id: 1,
    author: "0x742d...8963",
    authorKarma: 1250,
    title: "Monad 테스트넷에서 첫 DApp 배포 성공!",
    content: "드디어 Monad 테스트넷에 첫 DApp을 배포했습니다. 가스비가 정말 저렴하고 속도도 빠르네요...",
    community: "dev",
    timestamp: "2시간 전",
    upvotes: 42,
    downvotes: 3,
    comments: 12,
    bond: "0.1",
    status: "published",
    hasVoted: null,
  },
  {
    id: 2,
    author: "0x8f3a...2b4c",
    authorKarma: 520,
    title: "스테이킹 리워드 시스템 개선 제안",
    content: "현재 7일 에포크가 너무 긴 것 같습니다. 3일로 줄이면 어떨까요?",
    community: "governance",
    timestamp: "5시간 전",
    upvotes: 28,
    downvotes: 8,
    comments: 23,
    bond: "0.1",
    status: "challenged",
    hasVoted: "up",
  },
  {
    id: 3,
    author: "0x5c9e...7fa1",
    authorKarma: 890,
    title: "Web3 보안 가이드: 시드 문구 관리 방법",
    content: "많은 분들이 시드 문구 관리를 소홀히 하시는데, 이것만은 꼭 지켜주세요...",
    community: "security",
    timestamp: "8시간 전",
    upvotes: 156,
    downvotes: 2,
    comments: 34,
    bond: "0.1",
    status: "published",
    hasVoted: "up",
  },
];

const communities = [
  { id: "all", name: "All Communities", members: 15234 },
  { id: "dev", name: "Development", members: 4521 },
  { id: "governance", name: "Governance", members: 2103 },
  { id: "security", name: "Security", members: 3456 },
  { id: "trading", name: "Trading", members: 5654 },
];

export default function HomePage() {
  const { isConnected, address } = useAccount();
  const [selectedCommunity, setSelectedCommunity] = useState("all");
  const [sortBy, setSortBy] = useState("hot");
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  
  const {
    mdtBalance,
    stakeInfo,
    hasSBT,
    reputation,
    mintTokens,
    stakeTokens,
    createPost,
    createProfile,
    isProcessing,
    pendingRewards,
    claim
  } = useMonaddit();
  
  const { saveContent, listContents } = useBackendAPI();

  // Load posts from backend
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const contents = await listContents(20, 0);
        setPosts(contents || []);
      } catch (error) {
        console.error("Failed to load posts:", error);
        // Fallback to mock data
        setPosts(mockPosts);
      }
    };
    loadPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!newPost.title || !newPost.content) {
      alert("Please fill in both title and content");
      return;
    }

    try {
      setIsCreatingPost(true);
      
      // Save to backend first
      const savedContent = await saveContent({
        title: newPost.title,
        body: newPost.content,
        author: address || "0x0000000000000000000000000000000000000000",
      });
      
      // Generate content hash
      const contentHash = keccak256(toBytes(JSON.stringify({
        title: newPost.title,
        body: newPost.content,
        author: address,
        timestamp: Date.now()
      })));
      
      // Publish to blockchain
      await createPost(contentHash, `backend:${savedContent.id}`);
      
      // Refresh posts
      const contents = await listContents(20, 0);
      setPosts(contents || mockPosts);
      
      // Reset form
      setNewPost({ title: "", content: "" });
      setIsCreatingPost(false);
    } catch (error) {
      console.error("Failed to create post:", error);
      setIsCreatingPost(false);
    }
  };

  const handleVote = (postId: number, voteType: "up" | "down") => {
    console.log(`Voting ${voteType} on post ${postId}`);
    // Implement voting logic
  };

  const handleChallenge = (postId: number) => {
    console.log(`Challenging post ${postId}`);
    // Implement challenge logic
  };

  // Helper function for number parsing
  const parseFloat = (value: string) => Number(value);

  const PostCard = ({ post }: { post: typeof mockPosts[0] }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex">
        {/* Vote Section */}
        <div className="flex flex-col items-center p-4 bg-secondary/30">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              post.hasVoted === "up" && "text-orange-500"
            )}
            onClick={() => handleVote(post.id, "up")}
          >
            <ArrowBigUp className="h-5 w-5" />
          </Button>
          <span className="font-bold text-sm py-1">
            {post.upvotes - post.downvotes}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              post.hasVoted === "down" && "text-blue-500"
            )}
            onClick={() => handleVote(post.id, "down")}
          >
            <ArrowBigDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4">
          {/* Post Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Badge variant="outline" className="text-xs">
              r/{post.community}
            </Badge>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={`https://avatar.vercel.sh/${post.author}`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="font-medium">{post.author}</span>
              <Badge variant="secondary" className="text-xs ml-1">
                <Award className="h-3 w-3 mr-1" />
                {post.authorKarma}
              </Badge>
            </div>
            <span>•</span>
            <span>{post.timestamp}</span>
            {post.status === "challenged" && (
              <>
                <span>•</span>
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Challenged
                </Badge>
              </>
            )}
          </div>

          {/* Post Title */}
          <Link href={`/post/${post.id}`}>
            <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer">
              {post.title}
            </h3>
          </Link>

          {/* Post Content Preview */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.content}
          </p>

          {/* Post Actions */}
          <div className="flex items-center gap-4">
            <Link href={`/post/${post.id}`}>
              <Button variant="ghost" size="sm" className="h-8">
                <MessageSquare className="h-4 w-4 mr-1" />
                {post.comments} Comments
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="h-8">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            {isConnected && post.status === "published" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:text-destructive"
                onClick={() => handleChallenge(post.id)}
              >
                <Shield className="h-4 w-4 mr-1" />
                Challenge
              </Button>
            )}
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Coins className="h-3 w-3" />
              <span>{post.bond} MDT</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          {/* Welcome Alert for New Users */}
          {!isConnected && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>모나딧에 오신 것을 환영합니다!</strong> 
                지갑을 연결하고 10 MDT를 스테이킹하면 커뮤니티에 참여할 수 있습니다.
              </AlertDescription>
            </Alert>
          )}

          {/* Create Post Section */}
          {isConnected && hasSBT && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                {!isCreatingPost ? (
                  <Button 
                    className="w-full" 
                    onClick={() => setIsCreatingPost(true)}
                    disabled={!stakeInfo || parseFloat(stakeInfo.available) < 0.1}
                  >
                    Create Post (0.1 MDT Bond)
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Post title..."
                      className="w-full px-3 py-2 border rounded-md"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    />
                    <textarea
                      placeholder="Post content..."
                      className="w-full px-3 py-2 border rounded-md h-24 resize-none"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCreatePost}
                        disabled={isProcessing || !newPost.title || !newPost.content}
                      >
                        {isProcessing ? "Publishing..." : "Publish"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsCreatingPost(false);
                          setNewPost({ title: "", content: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sorting Tabs */}
          <Tabs value={sortBy} onValueChange={setSortBy} className="mb-6">
            <TabsList>
              <TabsTrigger value="hot" className="gap-2">
                <Flame className="h-4 w-4" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Clock className="h-4 w-4" />
                New
              </TabsTrigger>
              <TabsTrigger value="top" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Top
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard key={post.id || post.content_id} post={{
                  ...post,
                  id: post.id || post.content_id,
                  upvotes: post.upvotes || 0,
                  downvotes: post.downvotes || 0,
                  comments: post.comments || 0,
                  bond: "0.1",
                  status: post.status || "published",
                  timestamp: post.created_at ? new Date(post.created_at).toLocaleString() : "방금 전",
                  community: "all",
                  authorKarma: 100,
                  content: post.body || post.content,
                }} />
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No posts yet. Be the first to create one!
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Community Filter */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Communities
              </h3>
            </CardHeader>
            <CardContent>
              <Select value={selectedCommunity} onValueChange={setSelectedCommunity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{community.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {community.members.toLocaleString()}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Staking Info */}
          {isConnected && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Your Staking
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-medium">{mdtBalance} MDT</span>
                </div>
                {stakeInfo ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Staked</span>
                      <span className="font-medium">{stakeInfo.totalAmount} MDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium">{stakeInfo.available} MDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Locked</span>
                      <span className="font-medium">{stakeInfo.reserved} MDT</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => mintTokens("100")}
                      disabled={isProcessing}
                    >
                      Get Test Tokens (100 MDT)
                    </Button>
                    {parseFloat(mdtBalance) >= 10 && (
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => stakeTokens("10")}
                        disabled={isProcessing}
                      >
                        Stake 10 MDT
                      </Button>
                    )}
                  </div>
                )}
                {!hasSBT && stakeInfo && parseFloat(stakeInfo.totalAmount) >= 10 && (
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={createProfile}
                    disabled={isProcessing}
                  >
                    Create Profile (Mint SBT)
                  </Button>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pending Rewards</span>
                  <Badge variant="secondary" className="text-xs">
                    +{pendingRewards} MDT
                  </Badge>
                </div>
                <Button 
                  className="w-full" 
                  size="sm"
                  onClick={claim}
                  disabled={isProcessing || parseFloat(pendingRewards) === 0}
                >
                  Claim Rewards
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Top Contributors */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Top Contributors
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { address: "0x742d...8963", karma: 1250, rank: 1 },
                  { address: "0x5c9e...7fa1", karma: 890, rank: 2 },
                  { address: "0x8f3a...2b4c", karma: 520, rank: 3 },
                ].map((user) => (
                  <div key={user.address} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {user.rank}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.address}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.karma} karma
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold">Platform Stats</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Staked</span>
                <span className="font-medium">152,340 MDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-medium">3,421</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Posts</span>
                <span className="font-medium">12,543</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Challenges Today</span>
                <span className="font-medium">8</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
