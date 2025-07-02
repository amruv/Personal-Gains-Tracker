import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays, subMonths, subYears, eachDayOfInterval, eachMonthOfInterval, eachYearOfInterval } from "date-fns";

interface Exercise {
  id: string;
  name: string;
  exercise_groups: { name: string };
}

interface ExerciseGroup {
  id: string;
  name: string;
}

interface WorkoutData {
  date: string;
  effort: number;
  exercise_name?: string;
}

type ViewMode = "week" | "month" | "year";

const Analytics = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [chartData, setChartData] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExercises();
    fetchExerciseGroups();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, exercise_groups(name)")
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

  const getDateRange = () => {
    const now = new Date();
    switch (viewMode) {
      case "week":
        return { start: subDays(now, 7), end: now };
      case "month":
        return { start: subMonths(now, 1), end: now };
      case "year":
        return { start: subYears(now, 1), end: now };
    }
  };

  const generateDateIntervals = (start: Date, end: Date) => {
    switch (viewMode) {
      case "week":
        return eachDayOfInterval({ start, end }).map(date => ({
          date: format(date, "MMM dd"),
          dateValue: format(date, "yyyy-MM-dd")
        }));
      case "month":
        return eachDayOfInterval({ start, end }).map(date => ({
          date: format(date, "MMM dd"),
          dateValue: format(date, "yyyy-MM-dd")
        }));
      case "year":
        return eachMonthOfInterval({ start, end }).map(date => ({
          date: format(date, "MMM yyyy"),
          dateValue: format(date, "yyyy-MM")
        }));
    }
  };

  const fetchSingleExerciseData = async () => {
    if (!selectedExercise) return;

    setLoading(true);
    const { start, end } = getDateRange();

    const { data, error } = await supabase
      .from("workout_entries")
      .select("workout_date, effort")
      .eq("exercise_id", selectedExercise)
      .gte("workout_date", format(start, "yyyy-MM-dd"))
      .lte("workout_date", format(end, "yyyy-MM-dd"))
      .order("workout_date");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load workout data",
        variant: "destructive",
      });
    } else {
      const intervals = generateDateIntervals(start, end);
      const processedData = intervals.map(interval => {
        const dayData = data?.filter(entry => {
          if (viewMode === "year") {
            return format(new Date(entry.workout_date), "yyyy-MM") === interval.dateValue;
          }
          return entry.workout_date === interval.dateValue;
        });
        
        const totalEffort = dayData?.reduce((sum, entry) => sum + parseFloat(entry.effort.toString()), 0) || 0;
        
        return {
          date: interval.date,
          effort: totalEffort
        };
      });

      setChartData(processedData);
    }

    setLoading(false);
  };

  const fetchGroupData = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    const { start, end } = getDateRange();

    // Get exercises in the selected group
    const { data: groupExercises, error: exerciseError } = await supabase
      .from("exercises")
      .select("id, name")
      .eq("group_id", selectedGroup);

    if (exerciseError) {
      toast({
        title: "Error",
        description: "Failed to load group exercises",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Get workout data for all exercises in the group
    const { data, error } = await supabase
      .from("workout_entries")
      .select("workout_date, effort, exercises(name)")
      .in("exercise_id", groupExercises?.map(ex => ex.id) || [])
      .gte("workout_date", format(start, "yyyy-MM-dd"))
      .lte("workout_date", format(end, "yyyy-MM-dd"))
      .order("workout_date");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load workout data",
        variant: "destructive",
      });
    } else {
      const intervals = generateDateIntervals(start, end);
      const exerciseNames = [...new Set(data?.map(entry => entry.exercises?.name).filter(Boolean))];
      
      const processedData = intervals.map(interval => {
        const dayData = data?.filter(entry => {
          if (viewMode === "year") {
            return format(new Date(entry.workout_date), "yyyy-MM") === interval.dateValue;
          }
          return entry.workout_date === interval.dateValue;
        });

        const result: any = { date: interval.date };
        
        exerciseNames.forEach(exerciseName => {
          const exerciseData = dayData?.filter(entry => entry.exercises?.name === exerciseName);
          const totalEffort = exerciseData?.reduce((sum, entry) => sum + parseFloat(entry.effort.toString()), 0) || 0;
          result[exerciseName || 'Unknown'] = totalEffort;
        });

        return result;
      });

      setChartData(processedData);
    }

    setLoading(false);
  };

  const handleAnalyze = () => {
    if (selectedExercise) {
      fetchSingleExerciseData();
    } else if (selectedGroup) {
      fetchGroupData();
    }
  };

  const colors = ["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#1E90FF", "#FF69B4"];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="gym-card p-8 mb-8">
        <h2 className="text-2xl font-bold gradient-text mb-6 text-center">
          Training Analytics
        </h2>

        {/* View Mode Toggle */}
        <div className="flex justify-center gap-4 mb-8">
          {(["week", "month", "year"] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              onClick={() => setViewMode(mode)}
              variant={viewMode === mode ? "default" : "outline"}
              className={viewMode === mode ? "gym-button-primary" : ""}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          ))}
        </div>

        {/* Exercise Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-lg font-semibold mb-3 block">
              Single Exercise
            </label>
            <Select 
              value={selectedExercise} 
              onValueChange={(value) => {
                setSelectedExercise(value);
                setSelectedGroup("");
              }}
            >
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

          <div>
            <label className="text-lg font-semibold mb-3 block">
              Exercise Group
            </label>
            <Select 
              value={selectedGroup} 
              onValueChange={(value) => {
                setSelectedGroup(value);
                setSelectedExercise("");
              }}
            >
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
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || (!selectedExercise && !selectedGroup)}
          className="w-full gym-button-primary text-lg py-4"
        >
          {loading ? "Analyzing..." : "Analyze Progress"}
        </Button>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="gym-card p-8">
          <h3 className="text-xl font-bold gradient-text mb-6 text-center">
            {selectedExercise 
              ? `${exercises.find(ex => ex.id === selectedExercise)?.name} Progress`
              : `${exerciseGroups.find(group => group.id === selectedGroup)?.name} Group Progress`
            }
          </h3>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                />
                {selectedExercise ? (
                  <Line
                    type="monotone"
                    dataKey="effort"
                    stroke="#FFD700"
                    strokeWidth={3}
                    dot={{ fill: "#FFD700", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#FFD700", strokeWidth: 2 }}
                  />
                ) : (
                  <>
                    <Legend />
                    {Object.keys(chartData[0] || {})
                      .filter(key => key !== "date")
                      .map((exerciseName, index) => (
                        <Line
                          key={exerciseName}
                          type="monotone"
                          dataKey={exerciseName}
                          stroke={colors[index % colors.length]}
                          strokeWidth={3}
                          dot={{ strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                      ))}
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;