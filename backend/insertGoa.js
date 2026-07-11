import { supabase } from './utils/supabase.js';

const GOA_PARTIES = [
  { name: 'Bharatiya Janata Party (BJP)', yes: 22, no: 28 }, // 40 total seats in Goa
  { name: 'Indian National Congress (INC)', yes: 13, no: 37 },
  { name: 'Aam Aadmi Party (AAP)', yes: 5, no: 45 },
  { name: 'Maharashtrawadi Gomantak Party (MGP)', yes: 3, no: 47 },
  { name: 'Revolutionary Goans Party (RGP)', yes: 3, no: 47 },
  { name: 'All India Trinamool Congress (AITC)', yes: 2, no: 48 },
  { name: 'Goa Forward Party (GFP)', yes: 1, no: 49 },
  { name: 'Independent / Other', yes: 1, no: 49 },
]; // Sum of yes = 22 + 13 + 5 + 3 + 3 + 2 + 1 + 1 = 50. Perfect math!

async function insertGoa() {
  const groupId = 'elections-Goa2027';
  const groupTitle = 'Which party or alliance will win the Goa Legislative Assembly election?';
  const desc = 'This market resolves to YES for the political party or alliance that wins the majority of seats in the next Goa Legislative Assembly election.';
  const endDate = '2027-03-31T23:59:59Z'; // Approximate date

  for (const opt of GOA_PARTIES) {
    const question = \[GROUP:\] \ \\;
    
    // Check if exists
    const { data: existing } = await supabase.from('markets').select('market_id').eq('question', question).single();
    if (!existing) {
        const { error } = await supabase.from('markets').insert([{
            question: question,
            category: 'Politics',
            description: desc,
            house_yes_points: opt.yes,
            house_no_points: opt.no,
            status: 'Active',
            end_date: endDate
        }]);
        if (error) {
            console.error('Error inserting:', opt.name, error);
        } else {
            console.log('Inserted Goa party:', opt.name);
        }
    }
  }
}
insertGoa();
