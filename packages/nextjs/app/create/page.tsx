"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import {
  AlertCircle,
  FileText,
  Link,
  Hash,
  Coins,
  Send,
  Shield,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const communities = [
  { id: "general", name: "General", description: "General discussion" },
  { id: "dev", name: "Development", description: "Technical and development topics" },
  { id: "defi", name: "DeFi", description: "Decentralized finance discussion" },
  { id: "nft", name: "NFTs", description: "NFT and digital art" },
  { id: "gaming", name: "Gaming", description: "Blockchain gaming" },
];

export default function CreateContentPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [contentType, setContentType] = useState<"post" | "link">("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [community, setCommunity] = useState("");
  const [tags, setTags] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (contentType === "post" && !content.trim()) {
      toast.error("Content is required for posts");
      return;
    }

    if (contentType === "link" && !link.trim()) {
      toast.error("Link is required for link posts");
      return;
    }

    if (!community) {
      toast.error("Please select a community");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual submission logic
      // 1. Store content in backend
      // 2. Get content hash
      // 3. Submit to blockchain with bond
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction
      
      toast.success("Content published successfully! 0.1 MDT bond locked.");
      router.push("/");
    } catch (error) {
      toast.error("Failed to publish content");
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to create content.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Content</CardTitle>
          <CardDescription>
            Share your thoughts with the Monaddit community. 0.1 MDT bond required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Type Tabs */}
          <Tabs value={contentType} onValueChange={(v) => setContentType(v as "post" | "link")}>
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="post">
                <FileText className="h-4 w-4 mr-2" />
                Text Post
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link className="h-4 w-4 mr-2" />
                Link Post
              </TabsTrigger>
            </TabsList>

            {/* Community Selection */}
            <div className="space-y-2 mt-6">
              <Label htmlFor="community">Community *</Label>
              <Select value={community} onValueChange={setCommunity}>
                <SelectTrigger id="community">
                  <SelectValue placeholder="Select a community" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((comm) => (
                    <SelectItem key={comm.id} value={comm.id}>
                      <div>
                        <div className="font-medium">r/{comm.name}</div>
                        <div className="text-xs text-muted-foreground">{comm.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter an interesting title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={300}
              />
              <div className="text-xs text-muted-foreground text-right">
                {title.length}/300
              </div>
            </div>

            <TabsContent value="post" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                  maxLength={10000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {content.length}/10000
                </div>
              </div>
            </TabsContent>

            <TabsContent value="link" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="link">URL *</Label>
                <Input
                  id="link"
                  type="url"
                  placeholder="https://example.com"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-description">Description (Optional)</Label>
                <Textarea
                  id="link-description"
                  placeholder="Add context or your thoughts about this link..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px]"
                  maxLength={1000}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <Input
                id="tags"
                placeholder="ethereum, defi, monad (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Bond Information */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Content Bond Required: 0.1 MDT</div>
                <div className="text-sm">
                  • Bond will be locked for 7 days
                  • If no challenges, bond is returnable
                  • Malicious content may result in bond slashing
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Preview Section */}
          {showPreview && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">r/{community || "community"}</Badge>
                    {tags && tags.split(",").map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-lg">{title || "Untitled"}</h3>
                  {contentType === "post" ? (
                    <p className="text-sm whitespace-pre-wrap">{content || "No content"}</p>
                  ) : (
                    <div className="space-y-2">
                      <a href={link} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-500 hover:underline text-sm">
                        {link || "No link"}
                      </a>
                      {content && (
                        <p className="text-sm text-muted-foreground">{content}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                <Send className="h-4 w-4 mr-2" />
                Publish (0.1 MDT)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Publication</DialogTitle>
            <DialogDescription>
              Please review your content before publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Title</div>
              <div className="font-medium">{title}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Community</div>
              <Badge variant="outline">r/{community}</Badge>
            </div>
            <Alert>
              <Coins className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">0.1 MDT will be locked as bond</div>
                  <div className="text-xs">
                    This bond will be returned after 7 days if your content is not successfully challenged.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Publishing..." : "Confirm & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}