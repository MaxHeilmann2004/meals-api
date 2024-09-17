import { getAllDetailedMeals } from "@/app/meals_api";
import List from "@/components/List";
import { Suspense } from "react";

export default async function MealsPage() {
  const mealsData = await getAllDetailedMeals();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Meals</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <List initialData={mealsData} />
      </Suspense>
    </div>
  );
}
