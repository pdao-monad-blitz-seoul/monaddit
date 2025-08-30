"use client";

import { StakingPanel } from "~~/components/StakingPanel";
import { CreatePost } from "~~/components/CreatePost";
import { PostList } from "~~/components/PostList";

export default function StakingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Monaddit Platform</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Staking */}
        <div className="lg:col-span-1">
          <StakingPanel />
        </div>

        {/* Middle Column - Create Post */}
        <div className="lg:col-span-1">
          <CreatePost />
        </div>

        {/* Right Column - Recent Posts */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Recent Posts</h2>
              <PostList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}