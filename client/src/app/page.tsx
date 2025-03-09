"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Team {
  name: string;
  offensiveRating: number;
  defensiveRating: number;
  threePointPercentage: number;
  conference: string;
  weightedRating: number;
}

interface GameResult {
  gameNumber: number;
  winner: string;
  team1Rating: string;
  team2Rating: string;
  homeTeam: string;
}

interface SeriesResult {
  winner: Team;
  team1Wins: number;
  team2Wins: number;
  team1Name: string;
  team2Name: string;
  games: GameResult[];
}

interface ConferenceResults {
  round1: SeriesResult[];
  round2: SeriesResult[];
  finals: SeriesResult;
}

interface PlayoffResults {
  Eastern: ConferenceResults;
  Western: ConferenceResults;
  Finals: SeriesResult;
  teams?: Team[];
}

export default function Home() {
  const [results, setResults] = useState<PlayoffResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [weightings, setWeightings] = useState({
    offense: 30,
    defense: 45,
    threePoint: 25,
  });
  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(weightings),
      });
      const data = await res.json();
      console.log("Backend Response:", data); // Debugging log
      setResults(data);
    } catch (error) {
      console.error("Error fetching simulation:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSimulation();
  }, []);

  const handleWeightChange = (key: string, value: number) => {
    setWeightings((prev) => ({ ...prev, [key]: value }));
  };

  const renderSeries = (
    series: SeriesResult[] | undefined,
    roundName: string
  ) => {
    if (!series) return null;
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{roundName}</CardTitle>
        </CardHeader>
        <CardContent>
          {series.map((s, i) => (
            <Accordion key={i} type="single" collapsible className="mb-2">
              <AccordionItem value={`item-${i}`}>
                <AccordionTrigger>
                  {s.team1Name} vs {s.team2Name}: {s.winner.name} wins{" "}
                  {s.team1Wins}-{s.team2Wins}
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5">
                    {s.games.map((g) => (
                      <li key={g.gameNumber}>
                        Game {g.gameNumber}: {g.winner} wins ({g.team1Rating} vs{" "}
                        {g.team2Rating}) [Home: {g.homeTeam}]
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (!results)
    return (
      <div className="text-center p-4 text-red-500">No data available</div>
    );

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-center mb-6">
        NBA Playoff Simulator
      </h1>
      <div className="flex justify-between items-center mb-6">
        <Button onClick={fetchSimulation}>Resimulate</Button>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline">Adjust Weightings</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Adjust Weightings</DrawerTitle>
              <DrawerDescription>
                Set the percentage weightings for each category.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 space-y-4">
              <div>
                <Label>Offensive Rating (%)</Label>
                <Input
                  type="number"
                  value={weightings.offense}
                  onChange={(e) =>
                    handleWeightChange("offense", parseInt(e.target.value))
                  }
                />
              </div>
              <div>
                <Label>Defensive Rating (%)</Label>
                <Input
                  type="number"
                  value={weightings.defense}
                  onChange={(e) =>
                    handleWeightChange("defense", parseInt(e.target.value))
                  }
                />
              </div>
              <div>
                <Label>3-Point Percentage (%)</Label>
                <Input
                  type="number"
                  value={weightings.threePoint}
                  onChange={(e) =>
                    handleWeightChange("threePoint", parseInt(e.target.value))
                  }
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={fetchSimulation}>Apply</Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {["Eastern", "Western"].map((conf) => {
        const conference = conf as keyof Pick<
          PlayoffResults,
          "Eastern" | "Western"
        >;
        const conferenceData = results[conference];

        if (!conferenceData) {
          console.error(`No data for ${conf} conference`);
          return (
            <div key={conf} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">{conf} Conference</h2>
              <div className="text-red-500">
                No data available for {conf} conference.
              </div>
            </div>
          );
        }

        return (
          <div key={conf} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{conf} Conference</h2>
            {renderSeries(conferenceData.round1, "First Round")}
            {renderSeries(conferenceData.round2, "Conference Semifinals")}
            {renderSeries([conferenceData.finals], "Conference Finals")}
          </div>
        );
      })}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">NBA Finals</h2>
        {results.Finals ? (
          <>
            {renderSeries([results.Finals], "NBA Finals")}
            <h3 className="text-xl font-bold text-center text-pink-600 mt-4">
              Champion: {results.Finals.winner.name}
            </h3>
          </>
        ) : (
          <div className="text-red-500">No data available for NBA Finals.</div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.teams?.length ? (
              results.teams.map((t) => (
                <li key={t.name} className="text-sm">
                  {t.name} (Rating: {t.weightedRating.toFixed(2)}, OFF:{" "}
                  {t.offensiveRating}, DEF: {t.defensiveRating}, 3PT%:{" "}
                  {(t.threePointPercentage * 100).toFixed(1)}%)
                </li>
              ))
            ) : (
              <li className="text-sm text-red-500">No team data available</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
