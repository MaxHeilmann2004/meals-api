import List from "@/components/List";
import { ModeToggle } from "@/components/ModeToggle";
import { getAllDetailedMeals } from "@/lib/meals_api";
import { Suspense } from "react";

export default async function MealsPage() {
  const mealsData = await getAllDetailedMeals();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-primary font-bold">
          Better Better Better Mealplan
        </h1>
        <ModeToggle />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <List initialData={mealsData} />
      </Suspense>
    </div>
  );
}
