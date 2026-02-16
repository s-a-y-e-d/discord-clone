"use client";

import { Check, Download, FileText, File as FileIcon, Image as ImageIcon, RotateCcw, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Member, MemberRole, Message, User } from "@/generated/prisma";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RightSidebarProps {
  serverFiles?: (Message & { member: Member & { user: User } })[];
  role?: MemberRole;
}

export const RightSidebar = ({
  serverFiles = [],
}: RightSidebarProps) => {
  // Pomodoro State
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer countdown effect
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            setIsPaused(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  // Session Goals State
  const [goals, setGoals] = useState([
    { id: 1, text: "GF", completed: false },
    { id: 2, text: "Solve Practice Problems 1-5", completed: false },
    { id: 3, text: "Outline Lab Report", completed: false },
  ]);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTimeValue, setEditTimeValue] = useState("");

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(true);
    setTime(25 * 60);
  };

  const saveTime = () => {
    const minutes = parseInt(editTimeValue);
    if (!isNaN(minutes) && minutes > 0) {
      setTime(minutes * 60);
      setIsEditingTime(false);
      setEditTimeValue("");
    } else {
      setIsEditingTime(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")} : ${secs.toString().padStart(2, "0")}`;
  };

  const addNewGoal = () => {
    if (newGoalText.trim()) {
      setGoals([...goals, { id: Date.now(), text: newGoalText, completed: false }]);
      setNewGoalText("");
      setIsAddingGoal(false);
    }
  };

  const toggleGoal = (id: number) => {
    setGoals(goals.map(goal =>
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  return (
    <div className="flex flex-col h-full w-full bg-[rgb(35,36,40)] border-l border-[#1f2128] p-4 gap-4">

      {/* Pomodoro Timer */}
      <div className="bg-[#1a1b21] rounded-xl shadow-lg p-4 space-y-3 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Pomodoro Timer</span>
          <div className={cn("h-4 w-4 rounded-full transition-colors", isActive && !isPaused ? "bg-green-500 animate-pulse" : "bg-orange-500")} />
        </div>
        {isEditingTime ? (
          <div className="flex items-center justify-center py-4">
            <Input
              value={editTimeValue}
              onChange={(e) => setEditTimeValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveTime();
                } else if (e.key === "Escape") {
                  setIsEditingTime(false);
                }
              }}
              onBlur={saveTime}
              placeholder="Mins"
              className="w-24 text-center bg-zinc-900/50 border-zinc-700 text-white focus-visible:ring-primary"
              autoFocus
            />
          </div>
        ) : (
          <div
            onClick={() => {
              if (isActive && !isPaused) return;
              setIsEditingTime(true);
              setEditTimeValue(Math.floor(time / 60).toString());
              setIsActive(false);
              setIsPaused(true);
            }}
            className={cn("text-2xl font-bold text-white text-center py-4 tracking-widest tabular-nums transition-colors", (isActive && !isPaused) ? "" : "cursor-pointer hover:text-primary")}
          >
            {formatTime(time)}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={toggleTimer}
            className={cn("flex-1 transition-colors", isActive && !isPaused ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground")}
          >
            {isActive && !isPaused ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800 flex-shrink-0">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-center text-zinc-500">Current Phase: {isActive ? (isPaused ? "Paused" : "Focus") : "Ready"}</p>
      </div>

      {/* Session Goals */}
      <Card className="bg-[#1a1b21] border-none shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Session Goals</CardTitle>
          <div
            onClick={() => setIsAddingGoal(!isAddingGoal)}
            className="text-primary text-xl cursor-pointer hover:text-primary/80 transition-colors"
          >
            +
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAddingGoal && (
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={newGoalText}
                onChange={(e) => setNewGoalText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addNewGoal();
                  }
                }}
                placeholder="Add a new goal..."
                className="h-8 bg-zinc-900/50 border-zinc-700 text-zinc-200 focus-visible:ring-primary focus-visible:ring-offset-0 placeholder:text-zinc-600"
                autoFocus
              />
            </div>
          )}
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => toggleGoal(goal.id)}
            >
              <div className={cn(
                "flex-shrink-0 h-5 w-5 rounded-full border border-primary flex items-center justify-center transition-all",
                goal.completed ? "bg-primary text-primary-foreground" : "bg-transparent text-transparent hover:bg-primary/10"
              )}>
                <Check className="h-3 w-3" />
              </div>
              <span className={cn(
                "text-sm transition-colors decoration-2 select-none flex-1",
                goal.completed ? "text-zinc-500 line-through decoration-zinc-500/50" : "text-zinc-300 group-hover:text-white"
              )}>
                {goal.text}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGoals(goals.filter((g) => g.id !== goal.id));
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 flex-shrink-0 p-0.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Shared Files & Resources */}
      <Card className="flex-1 bg-[#1a1b21] border-none shadow-lg flex flex-col min-h-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Shared Files & Resources</CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-6 pb-4">
            <div className="space-y-3 pt-2">
              {serverFiles.map((file) => {
                const fileType = file.fileUrl?.split('.').pop()?.toLowerCase();
                const isPdf = fileType === 'pdf';
                const isImage = ['png', 'jpg', 'jpeg', 'gif'].includes(fileType || '');
                const isZip = ['zip', 'rar', '7z'].includes(fileType || '');

                return (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group">
                    <a
                      href={file.fileUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                    >
                      <div className={cn("flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center",
                        isPdf ? "bg-red-400/10 text-red-400" :
                          isZip ? "bg-amber-400/10 text-amber-400" :
                            isImage ? "bg-blue-400/10 text-blue-400" : "bg-blue-500/10 text-blue-500"
                      )}>
                        {isPdf && <FileIcon className="h-5 w-5" />}
                        {isZip && <FileIcon className="h-5 w-5" />}
                        {isImage && <ImageIcon className="h-5 w-5" />}
                        {!isPdf && !isZip && !isImage && <FileText className="h-5 w-5" />}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm text-zinc-200 truncate font-medium">{file.content}</span>
                        <span className="text-xs text-zinc-500">Shared by {file.member.user.name}</span>
                      </div>
                    </a>
                    <a href={file.fileUrl || "#"} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white transition-opacity flex-shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                );
              })}
              {serverFiles.length === 0 && (
                <p className="text-center text-zinc-500 text-sm py-4">No shared files yet.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}
