'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting verticles, countries, and tasks
 *                 for a timesheet entry, based on the time of day and the user's previous entries.
 *
 * - suggestTimesheetDetails - The main function that triggers the suggestion flow.
 * - SuggestTimesheetDetailsInput - The input type for the suggestTimesheetDetails function.
 * - SuggestTimesheetDetailsOutput - The output type for the suggestTimesheetDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimesheetDetailsInputSchema = z.object({
  timeOfDay: z.string().describe('The time of day the timesheet is being filled out (e.g., morning, afternoon, evening).'),
  previousTasks: z.array(z.string()).describe('A list of the user\'s previously entered tasks.'),
  teamMember: z.string().describe('The name of the team member filling out the timesheet.'),
});
export type SuggestTimesheetDetailsInput = z.infer<typeof SuggestTimesheetDetailsInputSchema>;

const SuggestTimesheetDetailsOutputSchema = z.object({
  suggestedVerticles: z.array(z.string()).describe('A list of suggested verticles.'),
  suggestedCountries: z.array(z.string()).describe('A list of suggested countries.'),
  suggestedTasks: z.array(z.string()).describe('A list of suggested tasks.'),
});
export type SuggestTimesheetDetailsOutput = z.infer<typeof SuggestTimesheetDetailsOutputSchema>;

export async function suggestTimesheetDetails(input: SuggestTimesheetDetailsInput): Promise<SuggestTimesheetDetailsOutput> {
  return suggestTimesheetDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimesheetDetailsPrompt',
  input: {schema: SuggestTimesheetDetailsInputSchema},
  output: {schema: SuggestTimesheetDetailsOutputSchema},
  prompt: `Based on the time of day ({{{timeOfDay}}}), the user\'s previous tasks ({{{previousTasks}}}), and the team member ({{{teamMember}}}), suggest relevant verticles, countries, and tasks for a timesheet entry. Return the suggestions as arrays of strings. Be as concise as possible.

Consider these verticles (CMIS, TRI, LOF, TRG). Return maximum 3 suggestions.

Ensure to return values that would make sense for a creative media production team. Do not include suggestions which would not be applicable to a global media production team.
`,
});

const suggestTimesheetDetailsFlow = ai.defineFlow(
  {
    name: 'suggestTimesheetDetailsFlow',
    inputSchema: SuggestTimesheetDetailsInputSchema,
    outputSchema: SuggestTimesheetDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
