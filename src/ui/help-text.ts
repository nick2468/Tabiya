/**
 * Help about the app, in one place.
 *
 * Every course in this app explains chess. Nothing explained the application:
 * what it is for, what each screen wants, or what order to do things in. This
 * module is that prose, and it is a module rather than JSX for one reason.
 *
 * The Help document and the `?` panels have to say the same thing. A panel is
 * not a summary written beside a section; it IS a paragraph of that section,
 * interpolated into it, so the two cannot drift apart. `help.test.ts` holds
 * that: every panel must appear verbatim in the document.
 *
 * The second half of the same problem is the app moving under the prose.
 * Phase 17 renamed "Start" to "Reset" and "Play a game from here" to "Play
 * from here"; help written the week before would have been wrong the week
 * after, and silently. So `HELP_CONTROLS` lists every control this prose names
 * by name, and the test renders the screen and looks for it.
 *
 * House rules for anything added here: say what the screen actually does, not
 * what it ought to do. A sentence that cannot be checked against the screen
 * does not go in.
 */

/** The screens a control can be found on, for the test that goes looking. */
export type Screen = 'nav' | 'catalog' | 'study' | 'drill' | 'play' | 'progress'

/** A control named in the prose, and where the test should expect to find it. */
export interface HelpControl {
  name: string
  screen: Screen
}

/**
 * The `?` panels, each two to four sentences.
 *
 * Three of them, and the count is deliberate: a `?` on everything is a screen
 * that has given up on being clear. Each one is spliced into its section
 * below.
 */
export const PANELS = {
  'play-launch': {
    title: 'Who you are playing',
    text:
      "Any line lets the engine pick your opponent's replies from the whole course, " +
      "weighted the way the course weights them. This chapter's line keeps the game " +
      'inside the one chapter you pick, which is how you spar against a single defence. ' +
      'From a Study position starts from a position you sent over with Play from here, ' +
      'so it stays greyed out until you send one.',
  },
  'progress-chapters': {
    title: 'Chapters',
    text:
      'One row for each chapter of this course. Learnt counts the lines you have ticked ' +
      'on the Study screen, out of the lines the chapter has. Due counts the cards Drill ' +
      'is ready to ask you now. New counts the cards you have never answered, which are ' +
      'waiting for their first showing rather than overdue.',
  },
  'progress-concepts': {
    title: 'Concepts',
    text:
      'A concept is a tag the course author put on a move, such as king-safety or the ' +
      'c4-break, so recall can be measured by idea rather than by position. Accuracy is ' +
      'the share of your last twenty answers on that concept that were the repertoire ' +
      'move, counted in this course alone. A playable alternative still counts as not ' +
      'recalled.',
  },
} as const

export type PanelId = keyof typeof PANELS

/** The wording on every `?`. Never "New here?": nobody is a beginner here. */
export const HELP_LABEL = 'Help on this screen'

/** One section of the Help document. */
export interface HelpSection {
  id: string
  title: string
  body: string
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'what',
    title: 'What this is',
    body: [
      'Repertoire Trainer teaches you chess opening repertoires. A course is one',
      'repertoire, written as chapters of lines, with a note on every move saying why it',
      'is played. You study the lines, drill them until they come back on their own, and',
      'play them against Stockfish.',
      '',
      'It runs offline. Your progress stays on this machine, in your own user folder, and',
      'nothing about you goes anywhere else. Nothing here is a test and no number is a',
      'score: the numbers exist to tell you what to work on next.',
    ].join('\n'),
  },
  {
    id: 'loop',
    title: 'How it fits together',
    body: [
      'Five screens, and they run in a loop.',
      '',
      '1. **Courses** is the front door. Open one.',
      '2. **Study** is where you read a chapter and walk its lines. Tick the ones you have',
      '   learnt.',
      '3. **Drill** brings those lines back as questions, on a schedule.',
      '4. **Play** tests them in a real game against Stockfish.',
      '5. **Progress** shows what is sticking and what is not.',
      '',
      'Study and Play happen inside one course, so they need a course open and stay greyed',
      'out until you open one. Drill and Progress do not: the drill queue mixes every',
      'course you have learnt lines in, and Progress adds them all up before it shows you',
      'one.',
      '',
      'Nothing is compulsory and nothing is timed. Studying a chapter and never ticking a',
      'line is a fair way to use the app; you just will not get any drills.',
      '',
      'Help is the last thing in that row, after a faint line, because it is not a step.',
      'It is always there, including before you have opened anything.',
    ].join('\n'),
  },
  {
    id: 'courses',
    title: 'Courses',
    body: [
      'A course is one repertoire for one colour. It has a title, a colour, and chapters',
      'in a sensible order, and each chapter answers one thing your opponent can do.',
      '',
      'Some courses ship with the app. They are on the Courses screen the first time you',
      'open it and they cannot be deleted, because they are built into the app and would',
      'be back at the next start. Hide takes one off the screen instead, and loses',
      'nothing.',
      '',
      'You can add your own two ways. Add a course from a file reads a course bundle,',
      'which is a .pgn file somebody has written or exported, and installs it straight',
      'away. The installed app also reads any course folder you drop into its courses',
      'folder, which it names at the bottom of the Courses screen, at the next start.',
      '',
      'Export as a file writes any course out as a bundle, including the ones that ship',
      'with the app. That is how you move a course to another machine, and how you start',
      'one of your own without facing an empty file.',
      '',
      'Removing a course you added takes its files and nothing else. Your learnt lines and',
      'their schedules are kept, and come back if you import it again.',
    ].join('\n'),
  },
  {
    id: 'study',
    title: 'Study',
    body: [
      'Study shows one chapter at a time. Chapters, on the left, lists them.',
      '',
      'A line is one path through the chapter, from the first move to the last. The table',
      'under the board lists every line in the chapter. Click one to put it on the board.',
      'Then walk it a move at a time with the arrows, or press Auto step this line to',
      'watch it play itself. Reset puts the board back to the start of the chapter.',
      '',
      'Every move has a note saying why it is played, and some have a plan for the moves',
      'after it. Reading the notes is the point of the screen. The moves without them are',
      'the ones you already know.',
      '',
      'Learnt is the tick at the end of each row, and it is the only thing on this screen',
      'that changes anything else. Tick a line when you can play it without looking. Every',
      'one of your moves in it becomes a card in Drill. Until you tick something, Drill has',
      'nothing to ask you.',
      '',
      'Play from here starts a game against the engine from the position on the board, so',
      'you can try a line out the moment it makes sense to you.',
    ].join('\n'),
  },
  {
    id: 'drill',
    title: 'Drill',
    body: [
      'Drill asks you to play the repertoire move. A card is one position out of a line',
      'you have marked learnt, with you to move. It says which course and chapter it came',
      'from, because the queue mixes them.',
      '',
      'Play a move on the board and the app says what it was: the repertoire move, a wrong',
      'move the course author expected and wrote a note about, or something else. It never',
      'pretends to know that a move nobody listed is bad. It tells you what the repertoire',
      'plays and why.',
      '',
      'Then it schedules the card again. Get it right and the gap before it comes back',
      'grows, so a line you know well is asked rarely. Get it wrong and the gap shortens,',
      'and the card also comes round again before the session ends. The question over the',
      'buttons, How well did you know it?, has two answers when you played the repertoire',
      'move, and each button says how long the gap will be before you press it. Nothing',
      'about the schedule is hidden.',
      '',
      'A card is due when its gap has run out. Drill my weak areas first puts the concepts',
      'you have been getting wrong at the front of the queue, judged on your last twenty',
      'answers for each one. Start drilling works through what is due; if nothing is due,',
      'the screen says when the next card comes back.',
    ].join('\n'),
  },
  {
    id: 'play',
    title: 'Play',
    body: [
      'Play is a game against Stockfish, with your opponent steered into the lines you',
      'have studied. It is the test that drilling cannot be: nobody tells you which line',
      'you are in.',
      '',
      'Who you are playing chooses how the game starts. There are three ways.',
      '',
      PANELS['play-launch'].text,
      '',
      'How long stops the game at move 10, at move 15, or lets it run to the end. A short',
      'game is the opening drill; a full game is a game. How strong is a scale of one to',
      'eight, from Very casual to Unpleasant, and the numbers on the upper levels are the',
      "engine's own scale rather than an online rating.",
      '',
      'There is no evaluation on screen while you play. That is on purpose: a bar telling',
      'you how you are doing does the thinking the game is meant to train.',
      '',
      'Everything the engine knows comes out afterwards, in three parts. The repertoire',
      'says where the game left the course, and which side left it first, with the move',
      'the course would have played and its note. Your moves lists anything the engine',
      'calls an inaccuracy or worse. The final position gives a verdict in words.',
      '',
      'Leaving the repertoire is not the same as playing badly. The report says which one',
      'it was.',
    ].join('\n'),
  },
  {
    id: 'progress',
    title: 'Progress',
    body: [
      'Progress opens with a rollup across every course: lines learnt, how many cards you',
      'have, how many are due now, and how many you have never answered. Under it is the',
      'detail for one course, the one the Course dropdown at the top of the window names.',
      'Change the dropdown to change the course.',
      '',
      '**Chapters.** ' + PANELS['progress-chapters'].text,
      '',
      '**Concepts.** ' + PANELS['progress-concepts'].text,
      '',
      '**Games played** counts the games you have played and how often you were the one to',
      'leave the repertoire first.',
      '',
      '**Backup.** Export progress writes everything out to one file: learnt lines, card',
      'schedules and concept history. Import progress reads one back, and it replaces all',
      'of your progress rather than merging, so take an export before you try one.',
    ].join('\n'),
  },
  {
    id: 'words',
    title: 'Words we use',
    body: [
      '**Course.** One repertoire for one colour, as a set of chapters. Opening a course',
      'is what Study and Play work inside.',
      '',
      '**Chapter.** One part of a course, answering one thing your opponent can do.',
      '',
      '**Line.** One path through a chapter, from its first move to its last. Lines are',
      'what you tick as learnt, and they are listed in the table on the Study screen.',
      '',
      '**Card.** One position from a learnt line, with you to move, asked in Drill. Two',
      'lines that pass through the same position share one card.',
      '',
      '**Learnt.** Your own claim that you can play a line without looking. It makes the',
      'cards. It is a tick you can take off again.',
      '',
      '**Due.** A card whose gap has run out, so Drill will ask it now.',
      '',
      '**Never answered.** A card you have not yet seen, from a line you ticked but have',
      'not drilled. It is waiting, not overdue.',
      '',
      '**Concept.** A tag on a move, such as king-safety or the c4-break, put there by the',
      'course author. It is how Progress and the weak-areas filter measure recall by idea',
      'rather than by position.',
    ].join('\n'),
  },
]

/** The whole document, as one markdown string for `Prose`. */
export const HELP_DOCUMENT = HELP_SECTIONS.map(
  (section) => `### ${section.title}\n\n${section.body}`,
).join('\n\n')

/**
 * Every control this prose names, and the screen it is named on.
 *
 * The test asserts two things about each row: the prose really does use the
 * name, and a control with that accessible name really is on that screen. The
 * second is the one that matters. A rename that misses this file turns the
 * suite red instead of turning the help into a lie.
 */
export const HELP_CONTROLS: HelpControl[] = [
  { name: 'Courses', screen: 'nav' },
  { name: 'Study', screen: 'nav' },
  { name: 'Play', screen: 'nav' },
  { name: 'Drill', screen: 'nav' },
  { name: 'Progress', screen: 'nav' },
  { name: 'Help', screen: 'nav' },

  { name: 'Add a course from a file', screen: 'catalog' },
  { name: 'Export as a file', screen: 'catalog' },
  { name: 'Hide', screen: 'catalog' },

  { name: 'Chapters', screen: 'study' },
  { name: 'Auto step this line', screen: 'study' },
  { name: 'Reset', screen: 'study' },
  { name: 'Learnt', screen: 'study' },
  { name: 'Play from here', screen: 'study' },

  { name: 'Drill my weak areas first', screen: 'drill' },
  { name: 'Start drilling', screen: 'drill' },
  { name: 'How well did you know it?', screen: 'drill' },

  { name: 'Who you are playing', screen: 'play' },
  { name: 'Any line', screen: 'play' },
  { name: "This chapter's line", screen: 'play' },
  { name: 'How long', screen: 'play' },
  { name: 'How strong', screen: 'play' },

  { name: 'Chapters', screen: 'progress' },
  { name: 'Concepts', screen: 'progress' },
  { name: 'Games played', screen: 'progress' },
  { name: 'Backup', screen: 'progress' },
  { name: 'Export progress', screen: 'progress' },
  { name: 'Import progress', screen: 'progress' },
]
