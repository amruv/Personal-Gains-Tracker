
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  group_id: string;
  exercise_groups: { name: string };
}

const WorkoutEntry = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [workoutDate, setWorkoutDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
    // Set default date to today in IST
    const today = new Date();
    setWorkoutDate(today);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExercise || !weight || !reps || !workoutDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("workout_entries")
      .insert({
        exercise_id: selectedExercise,
        weight_kg: parseFloat(weight),
        reps: parseInt(reps),
        workout_date: format(workoutDate, 'yyyy-MM-dd'),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log workout entry",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success!",
        description: "Workout entry logged successfully",
      });
      // Reset form
      setSelectedExercise("");
      setWeight("");
      setReps("");
      setWorkoutDate(new Date());
    }

    setLoading(false);
  };

  const selectedExerciseData = exercises.find(ex => ex.id === selectedExercise);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Log Your Workout
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="date" className="text-lg font-semibold mb-3 block">
              Workout Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "gym-input justify-start text-left font-normal",
                    !workoutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {workoutDate ? format(workoutDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                <Calendar
                  mode="single"
                  selected={workoutDate}
                  onSelect={setWorkoutDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="exercise" className="text-lg font-semibold mb-3 block">
              Exercise
            </Label>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="gym-input">
                <SelectValue placeholder="Select an exercise" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {exercises.map((exercise) => (
                  <SelectItem 
                    key={exercise.id} 
                    value={exercise.id}
                    className="text-foreground hover:bg-muted"
                  >
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExerciseData && (
            <div>
              <Label className="text-lg font-semibold mb-3 block">
                Exercise Group
              </Label>
              <div className="gym-input bg-muted text-muted-foreground">
                {selectedExerciseData.exercise_groups.name}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="weight" className="text-lg font-semibold mb-3 block">
                Weight (KG)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 80.5"
                className="gym-input"
              />
            </div>

            <div>
              <Label htmlFor="reps" className="text-lg font-semibold mb-3 block">
                Repetitions
              </Label>
              <Input
                id="reps"
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g. 12"
                className="gym-input"
              />
            </div>
          </div>

          {weight && reps && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Calculated Effort:</span>
              <div className="text-2xl font-bold gradient-text">
                {(parseFloat(weight) * parseInt(reps)).toFixed(1)}
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full gym-button-primary text-lg py-4"
          >
            {loading ? "Logging..." : "Log Workout Entry"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default WorkoutEntry;
