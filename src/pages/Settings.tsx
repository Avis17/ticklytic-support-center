
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Badge,
  BadgeProps,
} from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Building,
  Mail,
  Phone,
  Globe,
  Save,
  Tag,
  Plus,
  X,
} from "lucide-react";

interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

interface SettingsData {
  companyInfo: CompanyInfo;
  categories: string[];
  priorities: {
    id: string;
    name: string;
    color: string;
  }[];
  autoResponseEnabled: boolean;
  autoResponseMessage: string;
}

const defaultSettings: SettingsData = {
  companyInfo: {
    name: "Ticklytic Support",
    email: "support@ticklytic.com",
    phone: "",
    website: "",
    address: "",
  },
  categories: [
    "Technical Issue",
    "Billing",
    "Feature Request",
    "General Inquiry",
    "Bug Report",
  ],
  priorities: [
    { id: "low", name: "Low", color: "#60A5FA" },
    { id: "normal", name: "Normal", color: "#34D399" },
    { id: "high", name: "High", color: "#FBBF24" },
    { id: "critical", name: "Critical", color: "#EF4444" },
  ],
  autoResponseEnabled: true,
  autoResponseMessage: "Thank you for contacting our support team. We've received your ticket and will respond as soon as possible.",
};

const Settings = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settingsData, setSettingsData] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  
  // Ensure only admins can access
  useEffect(() => {
    if (userRole !== "admin") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [userRole, navigate, toast]);
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settingsRef = doc(db, "settings", "general");
        const settingsSnapshot = await getDoc(settingsRef);
        
        if (settingsSnapshot.exists()) {
          const data = settingsSnapshot.data() as SettingsData;
          setSettingsData({
            ...defaultSettings,
            ...data,
            companyInfo: {
              ...defaultSettings.companyInfo,
              ...data.companyInfo,
            },
          });
        } else {
          // If no settings document exists yet, create one with defaults
          await setDoc(doc(db, "settings", "general"), defaultSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to load settings.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userRole === "admin") {
      fetchSettings();
    }
  }, [userRole, toast]);
  
  const handleCompanyInfoChange = (
    field: keyof CompanyInfo,
    value: string
  ) => {
    setSettingsData((prev) => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value,
      },
    }));
  };
  
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    if (settingsData.categories.includes(newCategory.trim())) {
      toast({
        title: "Category already exists",
        description: "This category is already in the list.",
        variant: "destructive",
      });
      return;
    }
    
    setSettingsData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategory.trim()],
    }));
    
    setNewCategory("");
  };
  
  const handleRemoveCategory = (category: string) => {
    setSettingsData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };
  
  const handleAutoResponseChange = (field: string, value: any) => {
    setSettingsData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const settingsRef = doc(db, "settings", "general");
      
      // Convert the settingsData to a plain object with no nested structure
      // This fixes the Firebase updateDoc type error
      const flattenedData = {
        "companyInfo.name": settingsData.companyInfo.name,
        "companyInfo.email": settingsData.companyInfo.email,
        "companyInfo.phone": settingsData.companyInfo.phone,
        "companyInfo.website": settingsData.companyInfo.website,
        "companyInfo.address": settingsData.companyInfo.address,
        "categories": settingsData.categories,
        "priorities": settingsData.priorities,
        "autoResponseEnabled": settingsData.autoResponseEnabled,
        "autoResponseMessage": settingsData.autoResponseMessage,
      };
      
      await updateDoc(settingsRef, flattenedData);
      
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getPriorityBadgeVariant = (color: string): BadgeProps["variant"] => {
    switch (color) {
      case "#EF4444":
        return "destructive";
      case "#FBBF24":
        return "default";
      case "#34D399":
        return "secondary";
      case "#60A5FA":
        return "outline";
      default:
        return "outline";
    }
  };
  
  if (userRole !== "admin") {
    return null;
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your support center settings</p>
      </div>
      
      <Tabs defaultValue="company" className="space-y-8">
        <TabsList>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="auto-response">Auto Response</TabsTrigger>
        </TabsList>
        
        {/* Company Profile Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details displayed throughout your support portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      value={settingsData.companyInfo.name}
                      onChange={(e) =>
                        handleCompanyInfoChange("name", e.target.value)
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Support Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settingsData.companyInfo.email}
                      onChange={(e) =>
                        handleCompanyInfoChange("email", e.target.value)
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyPhone"
                      value={settingsData.companyInfo.phone}
                      onChange={(e) =>
                        handleCompanyInfoChange("phone", e.target.value)
                      }
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyWebsite"
                      value={settingsData.companyInfo.website}
                      onChange={(e) =>
                        handleCompanyInfoChange("website", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyAddress">Address</Label>
                <Textarea
                  id="companyAddress"
                  value={settingsData.companyInfo.address}
                  onChange={(e) =>
                    handleCompanyInfoChange("address", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Categories</CardTitle>
              <CardDescription>
                Manage the categories that customers can select when submitting tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add new category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory();
                    }
                  }}
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex flex-wrap gap-2">
                {settingsData.categories.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 px-3"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{category}</span>
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                
                {settingsData.categories.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No categories defined yet. Add your first category above.
                  </p>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-3">Ticket Priorities</h3>
                <div className="flex flex-wrap gap-4">
                  {settingsData.priorities.map((priority) => (
                    <Badge
                      key={priority.id}
                      variant={getPriorityBadgeVariant(priority.color)}
                      className="py-1.5 px-3"
                    >
                      {priority.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Priority levels are predefined and cannot be modified.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Auto Response Tab */}
        <TabsContent value="auto-response">
          <Card>
            <CardHeader>
              <CardTitle>Auto Response Settings</CardTitle>
              <CardDescription>
                Configure automatic responses sent to customers when they submit a new ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  id="autoResponseEnabled"
                  className="w-5 h-5"
                  checked={settingsData.autoResponseEnabled}
                  onChange={(e) =>
                    handleAutoResponseChange("autoResponseEnabled", e.target.checked)
                  }
                />
                <Label htmlFor="autoResponseEnabled">
                  Send automatic response to new tickets
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="autoResponseMessage">Auto-Response Message</Label>
                <Textarea
                  id="autoResponseMessage"
                  value={settingsData.autoResponseMessage}
                  onChange={(e) =>
                    handleAutoResponseChange("autoResponseMessage", e.target.value)
                  }
                  rows={6}
                  disabled={!settingsData.autoResponseEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be automatically sent to customers when they submit a new ticket.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
