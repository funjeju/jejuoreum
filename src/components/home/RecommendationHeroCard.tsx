import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { OreumCard } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  oreum: OreumCard;
  isDiscovered: boolean;
  locale: string;
}

const TIER_LABEL: Record<string, string> = {
  beginner: "비기너", explorer: "익스플로러", master: "마스터",
};
const REGION_LABEL: Record<string, string> = {
  east: "동부", west: "서부", south: "남부", north: "북부", central: "중산간",
};

export function RecommendationHeroCard({ oreum, isDiscovered, locale }: Props) {
  return (
    <Link href={`/${locale}/oreum/${oreum.slug}`}>
      <Card className="relative overflow-hidden h-[200px] rounded-2xl cursor-pointer group border-0">
        {oreum.thumbnailUrl ? (
          <Image
            src={oreum.thumbnailUrl}
            alt={oreum.nameKo}
            fill
            className={cn(
              "object-cover group-hover:scale-105 transition-transform duration-500",
              !isDiscovered && "grayscale brightness-75"
            )}
            sizes="(max-width: 512px) 100vw, 512px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
            <span className="text-4xl font-bold text-white/30">{oreum.nameKo[0]}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {isDiscovered && (
          <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs text-white/75 mb-1">오늘의 추천 오름</p>
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{oreum.nameKo}</h2>
          <div className="flex gap-1.5 flex-wrap">
            {oreum.tier && (
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                {TIER_LABEL[oreum.tier]}
              </Badge>
            )}
            <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
              {REGION_LABEL[oreum.region]}
            </Badge>
            {oreum.emotionalKeywords.slice(0, 1).map((kw) => (
              <Badge key={kw} className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
