import { Link, useLocation } from "react-router-dom";
import { Dumbbell, BarChart3, Plus } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Log Workout", icon: Dumbbell },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/exercises", label: "Exercises", icon: Plus },
  ];

  return (
    <nav className="gym-card mb-8">
      <div className="p-6">
        <h1 className="text-3xl font-bold gradient-text mb-6 text-center">
          GYM TRACKER
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300
                  ${isActive 
                    ? 'gym-button-primary' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;