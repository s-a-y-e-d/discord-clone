import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string;
  className?: string;
  name?: string;
};

export default function UserAvatar({
  src,
  className,
  name
}: UserAvatarProps) {
  return (
    <Avatar className={cn(
      "h-7 w-7 md:h-10 md:w-10",
      className
    )}>
      <AvatarImage src={src} />
      <AvatarFallback>
        {name?.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
