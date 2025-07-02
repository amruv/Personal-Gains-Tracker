-- Create exercise groups table
CREATE TABLE public.exercise_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  group_id UUID NOT NULL REFERENCES public.exercise_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout entries table
CREATE TABLE public.workout_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  reps INTEGER NOT NULL,
  effort DECIMAL(8,2) GENERATED ALWAYS AS (weight_kg * reps) STORED,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (making data public for now since no auth mentioned)
ALTER TABLE public.exercise_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_entries ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (public access)
CREATE POLICY "Allow all operations on exercise_groups" 
ON public.exercise_groups 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on exercises" 
ON public.exercises 
FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations on workout_entries" 
ON public.workout_entries 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_exercise_groups_updated_at
BEFORE UPDATE ON public.exercise_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default exercise groups and exercises
INSERT INTO public.exercise_groups (name) VALUES 
('Chest'),
('Back'),
('Legs'),
('Shoulders'),
('Arms'),
('Core');

-- Get the group IDs and insert default exercises
INSERT INTO public.exercises (name, group_id) VALUES 
('Barbell Bench Press', (SELECT id FROM public.exercise_groups WHERE name = 'Chest')),
('Incline Dumbbell Press', (SELECT id FROM public.exercise_groups WHERE name = 'Chest')),
('Deadlift', (SELECT id FROM public.exercise_groups WHERE name = 'Back')),
('Pull-ups', (SELECT id FROM public.exercise_groups WHERE name = 'Back')),
('Squat', (SELECT id FROM public.exercise_groups WHERE name = 'Legs')),
('Leg Press', (SELECT id FROM public.exercise_groups WHERE name = 'Legs')),
('Overhead Press', (SELECT id FROM public.exercise_groups WHERE name = 'Shoulders')),
('Lateral Raises', (SELECT id FROM public.exercise_groups WHERE name = 'Shoulders')),
('Bicep Curls', (SELECT id FROM public.exercise_groups WHERE name = 'Arms')),
('Tricep Dips', (SELECT id FROM public.exercise_groups WHERE name = 'Arms'));