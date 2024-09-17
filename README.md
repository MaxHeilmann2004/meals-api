# MealsAPI

a simple API to get meals from Kochwerk

## Usage

```typescript
import MealsAPI, { MealLocation } from "meals-api";

const monday = new Date();
monday.setDate(monday.getDate() - monday.getDay() + 1);
const friday = new Date();
friday.setDate(friday.getDate() + (7 - friday.getDay()));

// Get meals for location Elbe from monday to friday (inclusive)
const meals = await MealsAPI.getMeals(monday, friday, MealLocation.Elbe);
```

## License

MIT
