import { useEffect,useState } from "react";
type SponsorCampaign={sponsor_name:string;campaign_name:string;headline:string;body:string;creative_image_url?:string|null;destination_url:string};
export default function SponsorSlot({placement}:{placement:"home_feed"|"court_detail"|"match_centre"|"competition_hub"}){
 const [campaigns,setCampaigns]=useState<SponsorCampaign[]>([]);
 useEffect(()=>{let active=true;fetch("/api/sponsorship?placement="+encodeURIComponent(placement)).then(async response=>{if(!response.ok)return {campaigns:[]};const data=await response.json();return data;}).then(data=>{if(active)setCampaigns(Array.isArray(data?.campaigns)?data.campaigns:[]);}).catch(()=>{if(active)setCampaigns([]);});return()=>{active=false;};},[placement]);
 if(!campaigns.length)return null;
 return <aside className="sponsor-slot" aria-label="Sponsored content">{campaigns.map((campaign,index)=><article className="sponsor-slot-card" key={campaign.campaign_name+"-"+index}><div className="sponsor-slot-label"><span>SPONSORED</span><small>{campaign.sponsor_name}</small></div><a className="sponsor-slot-link" href={campaign.destination_url} target="_blank" rel="sponsored noopener noreferrer"><div className="sponsor-slot-copy"><h3>{campaign.headline}</h3><p>{campaign.body}</p><span>LEARN MORE ↗</span></div>{campaign.creative_image_url&&<img src={campaign.creative_image_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>}</a></article>)}</aside>;
}
