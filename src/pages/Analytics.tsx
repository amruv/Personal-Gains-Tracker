
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

interface WorkoutEntry {
  id: string;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  workout_date: string;
  exercises: { name: string };
}

const Analytics = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [timeframe, setTimeframe] = useState("month");
  const [singleExerciseData, setSingleExerciseData] = useState<any[]>([]);
  const [groupData, setGroupData] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
    fetchExerciseGroups();
  }, []);

  useEffect(() => {
    if (selectedExercise) {
      fetchSingleExerciseData();
    }
  }, [selectedExercise, timeframe]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupData();
    }
  }, [selectedGroup, timeframe]);

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

  const fetchSingleExerciseData = async () => {
    if (!selectedExercise) return;

    const { data, error } = await supabase
      .from("workout_entries")
      .select("weight_kg, reps, workout_date")
      .eq("exercise_id", selectedExercise)
      .order("workout_date");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load workout data",
        variant: "destructive",
      });
      return;
    }

    const processedData = data?.map(entry => ({
      date: entry.workout_date,
      effort: entry.weight_kg * entry.reps
    })) || [];

    setSingleExerciseData(processedData);
  };

  const fetchGroupData = async () => {
    if (!selectedGroup) return;

    const { data, error } = await supabase
      .from("workout_entries")
      .select(`
        weight_kg, 
        reps, 
        workout_date,
        exercises!inner(name, group_id)
      `)
      .eq("exercises.group_id", selectedGroup)
      .order("workout_date");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load group workout data",
        variant: "destructive",
      });
      return;
    }

    // Group data by date and exercise
    const groupedData: { [key: string]: { [exercise: string]: number } } = {};
    
    data?.forEach(entry => {
      const date = entry.workout_date;
      const exerciseName = entry.exercises.name;
      const effort = entry.weight_kg * entry.reps;

      if (!groupedData[date]) {
        groupedData[date] = {};
      }

      if (!groupedData[date][exerciseName]) {
        groupedData[date][exerciseName] = 0;
      }

      groupedData[date][exerciseName] += effort;
    });

    // Convert to chart format
    const chartData = Object.entries(groupedData).map(([date, exercises]) => ({
      date,
      ...exercises
    }));

    setGroupData(chartData);
  };

  const selectedExerciseName = exercises.find(ex => ex.id === selectedExercise)?.name;
  const selectedGroupName = exerciseGroups.find(group => group.id === selectedGroup)?.name;

  return (
    <div className="space-y-8">
      <div className="gym-card p-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Training Analytics
        </h2>
        
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-48">
            <label className="text-lg font-semibold mb-3 block">Time Period</label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="gym-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="week" className="text-foreground hover:bg-muted">Week</SelectItem>
                <SelectItem value="month" className="text-foreground hover:bg-muted">Month</SelectItem>
                <SelectItem value="year" className="text-foreground hover:bg-muted">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Single Exercise Chart */}
      <div className="gym-card p-8">
        <h3 className="text-xl font-bold gradient-text mb-4">Single Exercise Progress</h3>
        <div className="mb-6">
          <label className="text-lg font-semibold mb-3 block">Select Exercise</label>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="gym-input">
              <SelectValue placeholder="Choose an exercise" />
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
        
        {singleExerciseData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={singleExerciseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#D4AF37" />
                <YAxis stroke="#D4AF37" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #D4AF37',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="effort" 
                  stroke="#D4AF37" 
                  strokeWidth={3}
                  dot={{ fill: '#D4AF37', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Exercise Group Chart */}
      <div className="gym-card p-8">
        <h3 className="text-xl font-bold gradient-text mb-4">Exercise Group Progress</h3>
        <div className="mb-6">
          <label className="text-lg font-semibold mb-3 block">Select Exercise Group</label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="gym-input">
              <SelectValue placeholder="Choose an exercise group" />
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
        
        {groupData.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={groupData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#D4AF37" />
                <YAxis stroke="#D4AF37" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #D4AF37',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                {/* Dynamically render lines for each exercise in the group */}
                {groupData.length > 0 && Object.keys(groupData[0])
                  .filter(key => key !== 'date')
                  .map((exerciseName, index) => (
                    <Line 
                      key={exerciseName}
                      type="monotone" 
                      dataKey={exerciseName} 
                      stroke={`hsl(${index * 60}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ strokeWidth: 2, r: 4 }}
                    />
                  ))
                }
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
