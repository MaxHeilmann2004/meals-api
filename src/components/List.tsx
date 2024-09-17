"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Cross2Icon, InfoCircledIcon } from "@radix-ui/react-icons";
import {
  endOfDay,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import { motion } from "framer-motion";
import React, { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";

import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Input } from "@/components/ui/input";
import { DetailedMeal } from "@/lib/meals_api";

// Feature mapping
const featureMap: Record<string, string> = {
  "11": "Vegan",
  // ... (rest of the feature map)
};

interface CardListProps {
  initialData: DetailedMeal[];
}

interface Filters {
  canteen: string[];
  allergens: string[];
  features: string[];
}

const NutrientDialog: React.FC<{ nutritionalInfo: nutritionalInfo }> = ({
  nutritionalInfo,
}) => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="ghost" size="icon">
        <InfoCircledIcon className="h-4 w-4" />
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nutrient Information</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-2">
        <p>Energy: {nutritionalInfo.kj} kJ</p>
        <p>Calories: {nutritionalInfo.kcal} kcal</p>
        <p>Fat: {nutritionalInfo.fat?.toFixed(1) ?? "N/A"}g</p>
        <p>
          Saturated Fat: {nutritionalInfo.saturatedFat?.toFixed(1) ?? "N/A"}g
        </p>
        <p>
          Carbohydrates: {nutritionalInfo.carbohydrates?.toFixed(1) ?? "N/A"}g
        </p>
        <p>Sugar: {nutritionalInfo.sugar?.toFixed(1) ?? "N/A"}g</p>
        <p>Protein: {nutritionalInfo.protein?.toFixed(1) ?? "N/A"}g</p>
        <p>Salt: {nutritionalInfo.salt?.toFixed(1) ?? "N/A"}g</p>
      </div>
    </DialogContent>
  </Dialog>
);

const CardList: React.FC<CardListProps> = ({ initialData }) => {
  const [meals] = useState<DetailedMeal[]>(() =>
    initialData.map((meal) => ({
      ...meal,
      features: meal.features.map((f) => featureMap[f] || f),
    }))
  );
  const [filters, setFilters] = useState<Filters>({
    canteen: [],
    allergens: [],
    features: [],
  });
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: new Date(),
    to: new Date(),
  }));

  const handleDateRangeChange = useCallback(
    (newDateRange: DateRange | undefined) => {
      setDateRange(newDateRange);
    },
    []
  );

  const getCO2Color = useMemo(() => {
    // CO2 emission benchmarks (in grams) for individual meals
    const benchmarks = {
      veryLow: 0, // 0g CO2e
      low: 200, // 0.2kg CO2e
      medium: 500, // 0.5kg CO2e
      high: 1000, // 1kg CO2e
      veryHigh: 1500, // 1.5kg CO2e and above
    };

    return (co2Value: number) => {
      let normalizedValue: number;

      if (co2Value <= benchmarks.veryLow) {
        normalizedValue = 0;
      } else if (co2Value <= benchmarks.low) {
        normalizedValue =
          ((co2Value - benchmarks.veryLow) /
            (benchmarks.low - benchmarks.veryLow)) *
          0.25;
      } else if (co2Value <= benchmarks.medium) {
        normalizedValue =
          0.25 +
          ((co2Value - benchmarks.low) / (benchmarks.medium - benchmarks.low)) *
            0.25;
      } else if (co2Value <= benchmarks.high) {
        normalizedValue =
          0.5 +
          ((co2Value - benchmarks.medium) /
            (benchmarks.high - benchmarks.medium)) *
            0.25;
      } else if (co2Value <= benchmarks.veryHigh) {
        normalizedValue =
          0.75 +
          ((co2Value - benchmarks.high) /
            (benchmarks.veryHigh - benchmarks.high)) *
            0.25;
      } else {
        normalizedValue = 1;
      }

      const hue = (1 - normalizedValue) * 120; // 120 is green, 0 is red
      return `hsl(${hue}, 100%, 35%)`; // Adjusted lightness for better visibility
    };
  }, []);

  const filterOptions = useMemo(() => {
    const options: Record<
      keyof Filters,
      { label: string; value: string; count: number }[]
    > = {
      canteen: [],
      allergens: [],
      features: [],
    };

    meals.forEach((meal) => {
      // Canteen
      const canteenName = meal.canteen.name;
      const canteenOption = options.canteen.find(
        (opt) => opt.value === canteenName
      );
      if (canteenOption) {
        canteenOption.count++;
      } else {
        options.canteen.push({
          label: canteenName,
          value: canteenName,
          count: 1,
        });
      }

      // Allergens and Features
      ["allergens", "features"].forEach((key) => {
        meal[key as keyof Pick<DetailedMeal, "allergens" | "features">].forEach(
          (item) => {
            const option = options[key as keyof Filters].find(
              (opt) => opt.value === item
            );
            if (option) {
              option.count++;
            } else {
              options[key as keyof Filters].push({
                label: item,
                value: item,
                count: 1,
              });
            }
          }
        );
      });
    });

    return options;
  }, [meals]);

  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      const matchesSearch = meal.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilters = (
        Object.keys(filters) as Array<keyof Filters>
      ).every((key) => {
        const filterValues = filters[key];
        if (!Array.isArray(filterValues) || filterValues.length === 0)
          return true;
        if (key === "canteen") return filterValues.includes(meal.canteen.name);
        return meal[key].some((v) => filterValues.includes(v));
      });

      const mealDate = parseISO(meal.date);
      const matchesDateRange =
        dateRange?.from && dateRange?.to
          ? isWithinInterval(mealDate, {
              start: startOfDay(dateRange.from),
              end: endOfDay(dateRange.to),
            })
          : true;

      return matchesSearch && matchesFilters && matchesDateRange;
    });
  }, [meals, search, filters, dateRange]);

  const handleFilterChange = useCallback(
    (filterName: keyof Filters, value: unknown) => {
      setFilters((prev) => ({
        ...prev,
        [filterName]: Array.isArray(value) ? value : [],
      }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({ canteen: [], allergens: [], features: [] });
    setDateRange(undefined);
  }, []);

  const isFiltered =
    Object.values(filters).some((v) => v.length > 0) || !!dateRange;

  const container = {
    hidden: { opacity: 1, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const sortedAndFilteredMeals = useMemo(() => {
    return filteredMeals
      .slice() // Create a shallow copy to avoid mutating the original array
      .sort((a, b) => {
        const co2A = a.sustainability?.co2?.co2Value ?? Infinity;
        const co2B = b.sustainability?.co2?.co2Value ?? Infinity;
        return co2A - co2B;
      });
  }, [filteredMeals]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-1 items-center space-x-2 flex-wrap gap-2">
          <Input
            placeholder="Search meals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          {Object.entries(filterOptions).map(([key, options]) => (
            <DataTableFacetedFilter
              key={key}
              column={{
                id: key,
                getFacetedUniqueValues: () =>
                  new Map(options.map((opt) => [opt.value, opt.count])),
                getFilterValue: () => filters[key as keyof Filters],
                setFilterValue: (value) =>
                  handleFilterChange(key as keyof Filters, value),
              }}
              title={key.charAt(0).toUpperCase() + key.slice(1)}
              options={options}
            />
          ))}
          <DatePickerWithRange
            date={dateRange}
            setDate={handleDateRangeChange}
          />
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div>Total meals: {filteredMeals.length}</div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {filteredMeals.map((meal) => (
          <motion.div key={meal.id} variants={item}>
            <Card className="overflow-hidden">
              <div className="h-40 overflow-hidden">
                <img
                  src={
                    meal.imageUrl ||
                    "https://kochwerk.konkaapps.de/KMSLiveRessources/speiseplangericht/Dummygerichtbild.jpg"
                  }
                  alt={meal.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader className="p-3 flex flex-row justify-between items-start">
                <CardTitle className="text-sm text-primary">
                  {meal.title}
                </CardTitle>
                <NutrientDialog nutritionalInfo={meal.nutritionalInfo} />
              </CardHeader>
              <CardContent className="p-3 pt-0 text-xs">
                <p>Date: {format(parseISO(meal.date), "PP")}</p>
                <p>Price: €{meal.price.toFixed(2)}</p>
                <p>Canteen: {meal.canteen.name}</p>
                <p>Allergens: {meal.allergens.join(", ")}</p>
                <p>Features: {meal.features.join(", ")}</p>
                {meal.sustainability?.co2 && (
                  <div className="flex items-center mt-2">
                    <div
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{
                        backgroundColor: getCO2Color(
                          meal.sustainability.co2.co2Value
                        ),
                      }}
                    >
                      CO2: {meal.sustainability.co2.co2Value}g
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CardList;
