
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Tag,
  Plus,
  Trash2,
  Save,
  Edit,
  X
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  description: string;
  ticketCount: number;
}

const Categories: React.FC = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [userRole, navigate, toast]);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesRef = collection(db, "categories");
        const q = query(categoriesRef, orderBy("name"));
        const snapshot = await getDocs(q);

        const categoryList: Category[] = [];
        snapshot.forEach(doc => {
          categoryList.push({
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description || "",
            ticketCount: doc.data().ticketCount || 0
          });
        });

        setCategories(categoryList);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'admin') {
      fetchCategories();
    }
  }, [userRole, toast]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Required Field",
        description: "Category name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const newCategory = {
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim(),
        ticketCount: 0,
        createdAt: new Date().toISOString()
      };

      // Generate a new document ID
      const newCategoryRef = doc(collection(db, "categories"));
      await setDoc(newCategoryRef, newCategory);

      setCategories([
        ...categories,
        {
          id: newCategoryRef.id,
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim(),
          ticketCount: 0
        }
      ]);

      // Reset form
      setNewCategoryName("");
      setNewCategoryDesc("");

      toast({
        title: "Category Added",
        description: `The category "${newCategoryName}" has been created.`
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      
      setCategories(categories.filter(category => category.id !== id));
      
      toast({
        title: "Category Deleted",
        description: `The category "${name}" has been deleted.`
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
    setEditDesc(category.description);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditName("");
    setEditDesc("");
  };

  const saveCategory = async (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Required Field",
        description: "Category name is required.",
        variant: "destructive"
      });
      return;
    }

    try {
      const categoryRef = doc(db, "categories", id);
      await setDoc(categoryRef, {
        name: editName.trim(),
        description: editDesc.trim()
      }, { merge: true });

      setCategories(
        categories.map(category => 
          category.id === id 
            ? { ...category, name: editName.trim(), description: editDesc.trim() }
            : category
        )
      );

      cancelEditing();
      
      toast({
        title: "Category Updated",
        description: `The category has been updated successfully.`
      });
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ticket Categories</h1>
        <p className="text-muted-foreground">
          Manage categories for organizing support tickets
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                <Tag className="inline-block mr-2 h-4 w-4" />
                {categories.length} categories available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : categories.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          {editingCategory === category.id ? (
                            <Input 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Category name"
                            />
                          ) : (
                            <div className="font-medium flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              {category.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCategory === category.id ? (
                            <Input 
                              value={editDesc}
                              onChange={(e) => setEditDesc(e.target.value)}
                              placeholder="Description (optional)"
                            />
                          ) : (
                            category.description || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {category.ticketCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingCategory === category.id ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={cancelEditing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => saveCategory(category.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => startEditing(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                disabled={category.ticketCount > 0}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No categories found</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first category to organize tickets
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Category</CardTitle>
              <CardDescription>Create a new ticket category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Enter category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Enter category description"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                />
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Categories;
