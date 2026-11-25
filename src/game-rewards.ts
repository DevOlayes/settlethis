export type RunnerRewardSettings = {
  ball_reward?: number;
  distance_step?: number;
  distance_reward?: number;
  points_threshold_one?: number;
  points_reward_one?: number;
  points_threshold_two?: number;
  points_reward_two?: number;
  per_run_cap?: number;
};
export type RunnerRewardBreakdown = { amount:number; football:number; distance:number; performance:number };
const safe = (value:number|undefined,fallback:number,min=0) => Number.isSafeInteger(value)&&Number(value)>=min?Number(value):fallback;
export function calculateRunnerSethisReward(input:{distance:number;points:number;footballs:number;dailyRemaining:number|null;settings?:RunnerRewardSettings}):RunnerRewardBreakdown {
  const {distance,points,footballs,dailyRemaining,settings={}}=input;
  if(![distance,points,footballs].every(value=>Number.isSafeInteger(value)&&value>=0)||!(dailyRemaining===null||(Number.isSafeInteger(dailyRemaining)&&dailyRemaining>=0)))throw new Error("Runner reward inputs must be non-negative whole numbers.");
  const ballReward=safe(settings.ball_reward,2),distanceStep=safe(settings.distance_step,500,1),distanceReward=safe(settings.distance_reward,5),thresholdOne=safe(settings.points_threshold_one,5000,1),thresholdTwo=safe(settings.points_threshold_two,10000,1),bonusOne=safe(settings.points_reward_one,10),bonusTwo=safe(settings.points_reward_two,20),perRunCap=safe(settings.per_run_cap,100);
  const football=footballs*ballReward,distanceBonus=Math.floor(distance/distanceStep)*distanceReward,performance=points>=thresholdTwo?bonusTwo:points>=thresholdOne?bonusOne:0;
  const proposed=perRunCap===0?football+distanceBonus+performance:Math.min(perRunCap,football+distanceBonus+performance);
  return {amount:Math.max(0,dailyRemaining===null?proposed:Math.min(proposed,dailyRemaining)),football,distance:distanceBonus,performance};
}
export type MysteryRewardSettings = Partial<Record<"reward_easy_clue1"|"reward_easy_clue2"|"reward_easy_clue3"|"reward_medium_clue1"|"reward_medium_clue2"|"reward_medium_clue3"|"reward_hard_clue1"|"reward_hard_clue2"|"reward_hard_clue3",number>>;
export function calculateMysterySethisReward(difficulty:"easy"|"medium"|"hard",clueIndex:number,dailyRemaining:number,settings:MysteryRewardSettings={}):number {
  if(!Number.isSafeInteger(clueIndex)||clueIndex<1||clueIndex>3||!Number.isSafeInteger(dailyRemaining)||dailyRemaining<0)throw new Error("Mystery reward inputs are invalid.");
  const key=("reward_"+difficulty+"_clue"+clueIndex) as keyof MysteryRewardSettings;
  const configured=settings[key];
  const reward=Number.isSafeInteger(configured)&&Number(configured)>=0?Number(configured):({easy:[10,7,5],medium:[20,14,10],hard:[35,25,15]}[difficulty][clueIndex-1]);
  return Math.max(0,Math.min(reward,dailyRemaining));
}
