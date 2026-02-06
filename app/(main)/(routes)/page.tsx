import { Button } from "@/components/ui/button";
import prisma from "@/lib/db";
export default async function Home() {

  const users = await prisma.user.findMany()
  console.log(users)
  return (
    <div>
      <p className="text-3xl font-bold`">Hello</p>
      <Button variant="destructive" className="mx-5 my-5">Hello</Button>
    </div>

  );
}
