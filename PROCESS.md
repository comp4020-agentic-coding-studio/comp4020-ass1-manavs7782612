# Process overview

## What I built

I built an interactive explainer for the VLOOKUP excel function. I work for a big corporate and one thing big corps love is reports. 
So, every quarter I come back to youtube to understand how the all-mighty VLOOKUP function works. I spend 15-20 minutes, make a few 
mistakes and then get the hang of it. vlookup.com is the solution to my problem and hopefully also to the millions of viewers on the 
videos I watched. It's made of 3 simple sections: The Definition; The Guided Walkthrough and the Practice Challenges. The user's 
journey starts at the definition - they get an intro/refresher on what the purpose of the function is. It then moves on to a worked 
example, they interactively go through a real formula and take in what each of the values compute. The journey ends with a practice 
section. This is where the user puts their learning into action and reinforces it. I added this section so that the making a few
mistakes step gets eliminated from my own process. The practice section consists of 3 challenges covering all the cases: the normal
case; the not found case and the out-of-bounds case, ensuring the learner doesn't face unexpected blockers when using it in real life.

## The moments that mattered

Three or four for an assignment; fewer is fine for a weekly prototype. Keep the
list short so each moment has room to do all four jobs:

1. **what happened** --- the problem, or the thing the agent got wrong
2. **what you did instead of the obvious thing** --- the call you made, and why
   it beat the obvious one
3. **how you knew it was right** --- the check you ran, the viewport you looked
   at, what you read before accepting the diff
4. **the citation** --- a commit or commit range, a `CLAUDE.md` change, a check
   that went from red to green, a prompt paired with the commit it produced

Jobs 2 and 3 are the ones the repo can't tell a reader on its own, so they're
where the marks are. The strongest moments are the ones where a correction
landed in the **harness** rather than in another prompt --- a rule added to
`CLAUDE.md`, a check wired up, an attempt thrown away: re-prompting until it
passes is the routine case, and changing what the agent works against is the
skilled one.

Cite each moment as a link whose text is the commit hash or range and whose
target is this repo's commit or compare URL, so a reader clicks straight to the
evidence:

- one commit: `[<sha>](https://github.com/<org>/<repo>/commit/<sha>)`
- a range: `[<sha>...<sha>](https://github.com/<org>/<repo>/compare/<sha>...<sha>)`

To pair a prompt with the commit it produced, quote the prompt (curated, not a
full transcript) next to the citation:


** The Pivot **

1. I initially worked on a completely different idea to the one published. Named 'Skyline', it took the user on a journey of using
camera motion to demonstrate the heights of the tallest buildings in the world when compared to a normal house. What I failed to accomplish with that idea, was bringing life to it, it lacked the depth of capturing the surroundings of the buildings where they were located, for example the Central Park Tower in New York didn't have the metallic concrete jungle surrounding it and neither did it have the iconinc new york street signs. 

2. What I did - Instead of refining it further and further with an ever-moving goal of realism, trying to make the virtual experience as mesmerising as the real one, I understood the limitation - of both my interest in the topic and the distinct nature of every building. A standard recipe for all 20 buildings could not capture what has taken centuries of culture diverging in different directions. So, I pivoted; to a problem, I was personally interested in. The problem was the VLOOKUP function in excel. Albeit a simple function, it plays a huge role in correlating data from different datasets and analysing them. The problem was that no-one had made a dedicated explainer. People had made lengthy wiki's and 15 minute long youtube videos but that's not what you want when you're in a time crunch for a report due on a Friday afternoon. I created a separate folder and started fresh, this time around, I loosened the harness. My initial harness prevented the agent to ideate and explore the ideas I gave it to elaborate, holding me back from brainstorming in collaboration with the agent, not just directing it to make exactly what I wanted. I opened up the stack and left the agent to make the choice, the only thing I added in the harness before starting was - 'It should work on both mobile and desktop'.

3. This gave me much better results, I knew what the goal was and the agent was not held back due to not being able capture the intricacies of the various centers of the regions. I was able to resonate with the problem being solved and that came through when I went thorugh the journey myself, analysing my emotions and if I was satisfied at the end. The further iterations increased my confidence in my grasp of the function and on the ability of the website for teaching it to me.

4. The evidence: I kept the Skyline repo building while I explored the alternative in a second local folder, so the decision itself is a prompt, not a commit:

   > "Let's pivot, I want to keep my current repo, but also want to start building something else for assignment 1 and at the end i will guage which one i want to submit? how do i manage that in git?"

   That second folder is where the VLOOKUP idea and its first plan actually took shape (kept local while I compared it against Skyline, so it has no commit history of its own worth citing). Once I'd used it myself and preferred it, the prompt that landed it in this repo was:

   > "I think the alt ass1 is the winner, put that in place of the ass1 git folder and commit and push that."

   which produced [`3d4c955`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-manavs7782612/commit/3d4c955d77d10ce344380de90998b6637efd28af) --- the commit that deletes the entire Skyline build (Vue components, 20 hand-drawn building SVGs, the parallax camera) and replaces it with the VLOOKUP walkthrough. The range from the Skyline harness commit to this one,
   [`96622c6...3d4c955`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-manavs7782612/compare/96622c6fb12922de4cc7d382114f3f2c6191454f...3d4c955d77d10ce344380de90998b6637efd28af),
   is the before/after of the pivot.


** The teaching strategy **

1. The initial draft of the VLOOKUP website gave a boiler plate, example guided walkthrough. It had similar content to the walkthrough section that made it into the final product but it failed to instill confidence in a learner. Going in the journey, a user would have no introduction to what the function actually is. Coming out of the journey, there is no evidence that the learner actually digested the information.

2. What I did - Instead of adding more static information to the website making it similar to all the articles and wikis already present on the topic, I asked the agent to brainstorm for the most effective teaching strategies using a combination of Theory, Teach By Example and Learn by Doing. Why it beat the obvious one is that the ones already existing didn't satisfy the target audience's need. The topic is not something someone learns for fun. They learn it to execute a task which has a deadline - a report due in 2 hours. They need somnething quick but they need to be confident that they have learnt it as mistakes are not acceptable. A mix of these strategies prove to teach a lot faster and better. The "What is it" section introduced/reminded a user to what the purpose of the function is. The guided-walkthrough shows a live usage of the function and delineates what each input does. It prompts the user during the walkthrough, further ensuring knowledge transfer. The final practice section tests the learner on the knowledge acquired - reinforcing the topic in their brain.

3. Combining all three strategies to learn the topic resulted in greater confidence while going through the journey. The journey felt complete and left me as a user satisfied with my hunger for the knowledge of the vlookup function. The added interactions increased the engagement factor and made a boring topic easier to learn.

4. The evidence: the brainstorm prompt, in the local folder mentioned above, that asked for a combination of strategies rather than one:

   > "Now I want the content to be redesigned, Give me 4 different options for what you think is the best approach for teaching someone vlookup. The strategies can be a combination of interactive cell choosing (learn-by-doing) OR walking through the steps for example. OR definition + etc. I do think the definition and purpose should be added. Look at a couple of websites that do already teach vlookup and think of ways to it interactive"

   That combination --- definition, worked example, practice --- is exactly the three-section structure (`DefinitionSection.tsx`, `Walkthrough.tsx`, `PracticeEditor.tsx`) that landed in this repo in [`3d4c955`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-manavs7782612/commit/3d4c955d77d10ce344380de90998b6637efd28af).


** The design methodology **

1. The outcome of the first plan I developed for the VLOOKUP project was minimal, unpolished and had much to improve for. The most lacking was the absence of a design ethos. The colour scheme was generic and the blocks were placed vertically, with no harmony between the elements. I then started making incremental edits and verifying manually which eventually did not scale to all the issues.

2. I asked the agent to adopt a strict design methodolody to capture engagement. I requestes a combination of Apple's HIG-derived principles (clarity, deference, depth) plus the Jobs-era simplicity-by-removal ethos, with concrete guidance to cut debatable choices rather than add options for them. Additionally, I added a rule to the harness that the focus of the website was on the journey of the user - all changes must improve the satisfaction of the user going through it. These combined gave a lot more structure to the finsihed product. It minimised empty space, made the layout more suitable for learning and grasping all the information at once. It followed the natural reading style of a person. This was done instead of making fixes for each fault I saw with the design. Adding this general policy and forcing a redesign fixed most of the problems automatically and ensured further changes would stay consistent with the current design.

3. The verification was done via a local preview of the website, both on my phone and my desktop. I verified the website held up under unexpected inputs and scaled to a phone screen appropriately even with the desktop version being primarily landscape.

4. The evidence: the instruction that put the policy in the harness rather than in another round of fixes:

   > "Add the apple design methodology into the harness. Also add that the journey should be the sole focus."

   That one line is why `CLAUDE.md` now carries a whole "Design methodology: Apple-style, journey-first" section instead of a one-off note --- landed in the same [`3d4c955`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-manavs7782612/commit/3d4c955d77d10ce344380de90998b6637efd28af) commit as the rest of the redesign. The policy proved itself later, unprompted by a specific fix: in [`b94b942`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-manavs7782612/commit/b94b9420281d17e095b1c62a241ef20834a5837d), styling the practice editor's range-picker buttons added its own harness rule ("Table-range controls carry the Excel table-array color") in the same commit as the change, so the next person to touch those controls inherits the constraint instead of re-litigating it.


