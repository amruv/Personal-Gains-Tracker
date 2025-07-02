
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  group_id: string;
  exercise_groups: { name: string };
}

interface ExerciseGroup {
  id: string;
  name: string;
}

const ExerciseManagement = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [selectedGroupForExercise, setSelectedGroupForExercise] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
    fetchExerciseGroups();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, group_id, exercise_groups(name)")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load exercises",
        variant: "destructive",
      });
    } else {
      setExercises(data || []);
    }
  };

  const fetchExerciseGroups = async () => {
    const { data, error } = await supabase
      .from("exercise_groups")
      .select("id, name")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load exercise groups",
        variant: "destructive",
      });
    } else {
      setExerciseGroups(data || []);
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newExerciseName || !selectedGroupForExercise) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("exercises")
      .insert({
        name: newExerciseName,
        group_id: selectedGroupForExercise,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add exercise",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Exercise added successfully",
      });
      setNewExerciseName("");
      setSelectedGroupForExercise("");
      fetchExercises();
    }

    setLoading(false);
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGroupName) {
      toast({
        title: "Missing Information",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("exercise_groups")
      .insert({
        name: newGroupName,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add exercise group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Exercise group added successfully",
      });
      setNewGroupName("");
      fetchExerciseGroups();
    }

    setLoading(false);
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", exerciseId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Exercise deleted successfully",
      });
      fetchExercises();
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const { error } = await supabase
      .from("exercise_groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete exercise group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Exercise group deleted successfully",
      });
      fetchExerciseGroups();
      fetchExercises(); // Refresh exercises as well
    }
  };

  return (
    <div className="space-y-8">
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Manage Exercises & Groups
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Exercise */}
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">Add New Exercise</h3>
            <form onSubmit={handleAddExercise} className="space-y-4">
              <div>
                <Label htmlFor="exerciseName" className="text-lg font-semibold mb-3 block">
                  Exercise Name
                </Label>
                <Input
                  id="exerciseName"
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Barbell Bench Press"
                  className="gym-input"
                />
              </div>

              <div>
                <Label htmlFor="exerciseGroup" className="text-lg font-semibold mb-3 block">
                  Exercise Group
                </Label>
                <Select value={selectedGroupForExercise} onValueChange={setSelectedGroupForExercise}>
                  <SelectTrigger className="gym-input">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {exerciseGroups.map((group) => (
                      <SelectItem 
                        key={group.id} 
                        value={group.id}
                        className="text-foreground hover:bg-muted"
                      >
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full gym-button-primary"
              >
                {loading ? "Adding..." : "Add Exercise"}
              </Button>
            </form>
          </div>

          {/* Add New Group */}
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4">Add New Exercise Group</h3>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <Label htmlFor="groupName" className="text-lg font-semibold mb-3 block">
                  Group Name
                </Label>
                <Input
                  id="groupName"
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Chest, Back, Legs"
                  className="gym-input"
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full gym-button-primary"
              >
                {loading ? "Adding..." : "Add Group"}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Exercise Groups List */}
      <div className="gym-card p-8">
        <h3 className="text-xl font-bold gradient-text mb-6">Exercise Groups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exerciseGroups.map((group) => (
            <Card key={group.id} className="bg-muted border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  {group.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Exercises List */}
      <div className="gym-card p-8">
        <h3 className="text-xl font-bold gradient-text mb-6">Exercises</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="bg-muted border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <div>
                    <div>{exercise.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {exercise.exercise_groups.name}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExercise(exercise.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExerciseManagement;
