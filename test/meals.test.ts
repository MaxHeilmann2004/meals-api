import { expect, test } from "vitest";
import MealsAPI, { MealLocation } from "../src";

test("get meals for monday of this week", async () => {
    const d = new Date();
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    const meals = await MealsAPI.getMeals(monday, monday, MealLocation.Elbe);
    expect(meals.length).toBeGreaterThan(0);
});
