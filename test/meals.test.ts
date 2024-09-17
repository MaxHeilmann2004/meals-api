import { expect, test } from "vitest";
import MealsAPI, { MealLocation } from "../src";

function getMonday() {
    const d = new Date();
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

test("get meals for 'Elbe' monday of this week", async () => {
    const monday = getMonday();

    const mealsElbe = await MealsAPI.getMeals(monday, monday, MealLocation.Elbe);
    expect(mealsElbe.length).toBeGreaterThan(0);
});

test("get meals for 'Steelrunner' monday of this week", async () => {
    const monday = getMonday();

    const mealsSteelrunner = await MealsAPI.getMeals(monday, monday, MealLocation.Steelrunner);
    expect(mealsSteelrunner.length).toBeGreaterThan(0);
});

test("get meals for 'Bonprix' monday of this week", async () => {
    const monday = getMonday();

    const mealsBonprix = await MealsAPI.getMeals(monday, monday, MealLocation.Bonprix);
    expect(mealsBonprix.length).toBeGreaterThan(0);
});

test("get meals for 'Boulevard' monday of this week", async () => {
    const monday = getMonday();

    const mealsBoulevard = await MealsAPI.getMeals(monday, monday, MealLocation.Boulevard);
    expect(mealsBoulevard.length).toBeGreaterThan(0);
});
