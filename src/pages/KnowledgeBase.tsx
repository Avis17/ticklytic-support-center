
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Tag, BookOpen, Book } from "lucide-react";

const DUMMY_ARTICLES = [
  {
    id: "1",
    title: "Getting Started with Ticklytic",
    category: "Guides",
    description: "Learn how to set up and use the Ticklytic system",
    tags: ["beginner", "setup", "onboarding"],
  },
  {
    id: "2",
    title: "Managing Ticket Categories",
    category: "Admin",
    description: "How to create and organize your ticket categories",
    tags: ["categories", "admin", "organization"],
  },
  {
    id: "3",
    title: "Agent Best Practices",
    category: "Agents",
    description: "Tips and tricks for efficient ticket handling",
    tags: ["agent", "productivity", "support"],
  },
  {
    id: "4",
    title: "Ticket Priority Explained",
    category: "Guides",
    description: "Understanding how ticket priorities work",
    tags: ["priority", "workflow", "triage"],
  },
  {
    id: "5",
    title: "Reporting Capabilities",
    category: "Reports",
    description: "Overview of available reports and metrics",
    tags: ["reports", "metrics", "analytics"],
  },
];

const CATEGORIES = ["All", "Guides", "Admin", "Agents", "Reports", "Troubleshooting"];

const KnowledgeBase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = DUMMY_ARTICLES.filter((article) => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">
          Find guides and resources for Ticklytic
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search the knowledge base..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex overflow-x-auto pb-2 space-x-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                    <CardDescription>{article.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm">
                      Read Article
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="flex justify-center mb-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No articles found matching your search.
                </p>
                <Button 
                  variant="link" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Clear filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Popular Articles</CardTitle>
              <CardDescription>Most frequently viewed resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DUMMY_ARTICLES.slice(0, 3).map((article) => (
                <div key={article.id} className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 mt-1 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm font-medium">{article.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {article.category}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View All Articles
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Guides", "Admin", "Agents", "Reports", "Troubleshooting"].map(
                (category) => (
                  <div
                    key={category}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <Book className="h-4 w-4 text-muted-foreground" />
                      <span>{category}</span>
                    </div>
                    <Badge variant="secondary">
                      {
                        DUMMY_ARTICLES.filter(
                          (article) => article.category === category
                        ).length
                      }
                    </Badge>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
