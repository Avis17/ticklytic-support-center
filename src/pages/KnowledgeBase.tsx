import React, { useState, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  doc, 
  writeBatch,
  addDoc,
  setDoc
} from "firebase/firestore";
import { useToast } from "@/components/ui/use-toast";

interface KBArticle {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
}

const KnowledgeBase: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const articlesRef = collection(db, "knowledge_base");
        const articlesQuery = query(articlesRef, orderBy("title"));
        const snapshot = await getDocs(articlesQuery);
        
        const fetchedArticles: KBArticle[] = [];
        const categoriesSet = new Set<string>();
        categoriesSet.add("All"); // Always include "All" category
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Omit<KBArticle, "id">;
          fetchedArticles.push({
            id: doc.id,
            title: data.title,
            category: data.category,
            description: data.description,
            tags: data.tags || [],
          });
          
          if (data.category) {
            categoriesSet.add(data.category);
          }
        });
        
        setArticles(fetchedArticles);
        setCategories(Array.from(categoriesSet));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching knowledge base articles:", error);
        toast({
          variant: "destructive",
          title: "Failed to load articles",
          description: "Please try refreshing the page.",
        });
        setLoading(false);
      }
    };

    // If the knowledge_base collection doesn't exist or is empty, seed it with dummy data
    const seedKnowledgeBase = async () => {
      try {
        const articlesRef = collection(db, "knowledge_base");
        const snapshot = await getDocs(articlesRef);
        
        if (snapshot.empty) {
          const DUMMY_ARTICLES = [
            {
              title: "Getting Started with Ticklytic",
              category: "Guides",
              description: "Learn how to set up and use the Ticklytic system",
              tags: ["beginner", "setup", "onboarding"],
            },
            {
              title: "Managing Ticket Categories",
              category: "Admin",
              description: "How to create and organize your ticket categories",
              tags: ["categories", "admin", "organization"],
            },
            {
              title: "Agent Best Practices",
              category: "Agents",
              description: "Tips and tricks for efficient ticket handling",
              tags: ["agent", "productivity", "support"],
            },
            {
              title: "Ticket Priority Explained",
              category: "Guides",
              description: "Understanding how ticket priorities work",
              tags: ["priority", "workflow", "triage"],
            },
            {
              title: "Reporting Capabilities",
              category: "Reports",
              description: "Overview of available reports and metrics",
              tags: ["reports", "metrics", "analytics"],
            },
          ];

          // Add dummy articles to the database - use addDoc instead to avoid potential issues
          for (const article of DUMMY_ARTICLES) {
            await addDoc(collection(db, "knowledge_base"), {
              ...article,
              createdAt: new Date().toISOString()
            });
          }
          console.log("Knowledge base seeded with sample data");
          
          // After seeding, fetch the articles
          fetchArticles();
        } else {
          fetchArticles();
        }
      } catch (error) {
        console.error("Error seeding knowledge base:", error);
        fetchArticles(); // Try to fetch articles anyway
      }
    };
    
    seedKnowledgeBase();
  }, [toast]);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get most viewed articles (in a real app, you'd track views in the database)
  const popularArticles = [...articles].sort(() => 0.5 - Math.random()).slice(0, 3);

  // Count articles by category
  const categoryCount = categories.reduce((acc, category) => {
    if (category === "All") return acc;
    
    acc[category] = articles.filter(article => article.category === category).length;
    return acc;
  }, {} as Record<string, number>);

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
            {loading ? (
              <div className="w-full py-4 text-center text-muted-foreground">Loading categories...</div>
            ) : (
              categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 w-1/3 bg-muted rounded"></div>
                    <div className="h-4 w-2/3 bg-muted rounded"></div>
                  </CardHeader>
                  <CardFooter>
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
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
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-4 h-4 rounded-full bg-muted"></div>
                      <div className="space-y-1 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : popularArticles.map((article) => (
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
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-4 w-6 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : categories.filter(c => c !== "All").map((category) => (
                <div
                  key={category}
                  className="flex justify-between items-center"
                >
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4 text-muted-foreground" />
                    <span>{category}</span>
                  </div>
                  <Badge variant="secondary">
                    {categoryCount[category] || 0}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
