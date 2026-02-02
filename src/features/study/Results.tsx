import { Center, Container, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import {
  fetchResults,
  type ParticipantResults,
} from "../../lib/participant_results";
import { ResultsCard } from "./ResultsCard";

interface ResultsProps {
  /** Session ID of user to fetch statistics for */
  session: string;
}

/**
 * Results page displayed after survey completion
 * @component
 */
export function Results({ session }: ResultsProps) {
  const [data, setData] = useState<ParticipantResults | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      const results = await fetchResults(session);
      if (results) {
        setData(results);
      } else {
        alert("An error occured while trying to fetch your results!");
      }
    };
    loadResults();
  }, [session]);

  return (
    <>
      <header style={{ background: "white" }}>
        <Container px="md">
          <Center style={{ padding: "16px 0" }}>
            <Title ta="center">Survey Complete!</Title>
          </Center>
        </Container>
      </header>
      <main>
        <Container size="sm" px="md">
          <Stack align="center" gap="md">
            <ResultsCard data={data}></ResultsCard>
          </Stack>
        </Container>
      </main>
    </>
  );
}
