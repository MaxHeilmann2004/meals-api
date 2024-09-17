"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import {
  endOfDay,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import React, { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";

import { DataTableFacetedFilter } from "@/components/data-table-faceted-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Input } from "@/components/ui/input";

import { DetailedMeal } from "@/app/meals_api";

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleDateRangeChange = useCallback(
    (newDateRange: DateRange | undefined) => {
      setDateRange(newDateRange);
    },
    []
  );

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeals.map((meal) => (
          <Card key={meal.id}>
            <CardHeader>
              <CardTitle>{meal.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Date: {format(parseISO(meal.date), "PP")}</p>
              <p>Price: €{meal.price.toFixed(2)}</p>
              <p>Canteen: {meal.canteen.name}</p>
              <p>Allergens: {meal.allergens.join(", ")}</p>
              <p>Features: {meal.features.join(", ")}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CardList;
