"use client";
import Image from "next/image";
import { useState } from "react";
import type { SpeciesObservation } from "@/src/lib/services/wildlife";
const groups: Record<string, string> = {
  Aves: "Bird",
  Plantae: "Plant",
  Insecta: "Insect",
  Mammalia: "Mammal",
  Reptilia: "Reptile",
  Amphibia: "Amphibian",
  Mollusca: "Mollusk",
  Actinopterygii: "Fish",
  Fungi: "Fungus",
  Arachnida: "Arachnid",
};
export function SpeciesPhoto({ animal }: { animal: SpeciesObservation }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = Boolean(animal.imageUrl && failedUrl !== animal.imageUrl);
  return (
    <figure className={`species-art ${hasImage ? "has-photo" : "no-photo"}`}>
      {hasImage ? (
        <Image
          src={animal.imageUrl!}
          alt={`${animal.commonName}${animal.imageKind === "species-reference" ? " — species reference photo" : " — observation photo"}`}
          fill
          sizes="(max-width: 440px) 100vw, (max-width: 760px) 50vw, 33vw"
          unoptimized
          onError={() => setFailedUrl(animal.imageUrl)}
        />
      ) : (
        <div className="species-photo-empty">
          <svg viewBox="0 0 80 80" aria-hidden="true">
            <path
              d="M15 52Q23 32 39 41Q42 16 63 14Q61 42 43 48Q58 43 67 51Q52 67 37 53L22 67"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            {failedUrl ? "Photo unavailable" : "No reusable photo available"}
          </span>
        </div>
      )}
      <span className="species-group">
        {groups[animal.group] ?? "Organism"}
      </span>
      {hasImage && (
        <figcaption className="photo-kind">
          {animal.imageKind === "species-reference"
            ? "Species reference photo"
            : "Photo from this observation"}
        </figcaption>
      )}
    </figure>
  );
}
