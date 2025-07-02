import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

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
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchExercises(), fetchExerciseGroups()]);
  };

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
    
    if (!newExerciseName.trim() || !selectedGroupForExercise) {
      toast({
        title: "Missing Information",
        description: "Please enter exercise name and select a group",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("exercises")
      .insert({
        name: newExerciseName.trim(),
        group_id: selectedGroupForExercise,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add exercise. It might already exist.",
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
    
    if (!newGroupName.trim()) {
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
        name: newGroupName.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add exercise group. It might already exist.",
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

  const handleDeleteExercise = async (exerciseId: string, exerciseName: string) => {
    if (!confirm(`Are you sure you want to delete "${exerciseName}"? This will also delete all workout entries for this exercise.`)) {
      return;
    }

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

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const exercisesInGroup = exercises.filter(ex => ex.group_id === groupId);
    
    if (exercisesInGroup.length > 0) {
      toast({
        title: "Cannot Delete",
        description: `Please delete all exercises in "${groupName}" first`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }

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
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Add New Exercise */}
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Add New Exercise
        </h2>
        
        <form onSubmit={handleAddExercise} className="space-y-6">
          <div>
            <Label htmlFor="exerciseName" className="text-lg font-semibold mb-3 block">
              Exercise Name
            </Label>
            <Input
              id="exerciseName"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="e.g. Barbell Bench Press"
              className="gym-input"
            />
          </div>

          <div>
            <Label className="text-lg font-semibold mb-3 block">
              Exercise Group
            </Label>
            <Select value={selectedGroupForExercise} onValueChange={setSelectedGroupForExercise}>
              <SelectTrigger className="gym-input">
                <SelectValue placeholder="Select an exercise group" />
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
            className="w-full gym-button-primary text-lg py-4"
          >
            <Plus size={20} className="mr-2" />
            {loading ? "Adding..." : "Add Exercise"}
          </Button>
        </form>
      </div>

      {/* Add New Exercise Group */}
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Add New Exercise Group
        </h2>
        
        <form onSubmit={handleAddGroup} className="space-y-6">
          <div>
            <Label htmlFor="groupName" className="text-lg font-semibold mb-3 block">
              Group Name
            </Label>
            <Input
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Chest, Back, Legs"
              className="gym-input"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full gym-button-primary text-lg py-4"
          >
            <Plus size={20} className="mr-2" />
            {loading ? "Adding..." : "Add Exercise Group"}
          </Button>
        </form>
      </div>

      {/* Exercise Groups List */}
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Exercise Groups
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exerciseGroups.map((group) => {
            const exercisesInGroup = exercises.filter(ex => ex.group_id === group.id);
            return (
              <div key={group.id} className="bg-secondary rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{group.name}</h3>
                  <Button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {exercisesInGroup.length} exercise{exercisesInGroup.length !== 1 ? 's' : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exercises List */}
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          All Exercises
        </h2>
        
        <div className="space-y-4">
          {exerciseGroups.map((group) => {
            const exercisesInGroup = exercises.filter(ex => ex.group_id === group.id);
            if (exercisesInGroup.length === 0) return null;

            return (
              <div key={group.id}>
                <h3 className="text-xl font-semibold gradient-text mb-3">{group.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {exercisesInGroup.map((exercise) => (
                    <div key={exercise.id} className="bg-secondary rounded-lg p-4 flex justify-between items-center">
                      <span className="font-medium">{exercise.name}</span>
                      <Button
                        onClick={() => handleDeleteExercise(exercise.id, exercise.name)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExerciseManagement;