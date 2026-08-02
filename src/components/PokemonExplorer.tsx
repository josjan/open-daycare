"use client";

import { useEffect, useState } from "react";

interface Pokemon {
  name: string;
  id: number;
  sprites: { front_default: string };
  types: { type: { name: string } }[];
}

export default function PokemonExplorer() {
  const [pokemonId, setPokemonId] = useState(1);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el Pokémon");
        return res.json();
      })
      .then((data: Pokemon) => {
        if (!cancelled) setPokemon(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el Pokémon");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

  return (
    <div className="flex flex-col items-center gap-5 rounded-[24px] border border-[#ECE0D0] bg-[#FFFDF9] p-6 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-1 text-[12.5px] font-extrabold tracking-wide text-[#D9583C]">
        POKÉMON ACTUAL
      </div>

      <div className="flex min-h-[140px] flex-col items-center justify-center gap-2">
        {loading && (
          <span className="text-[14.5px] text-[#94887B]">Cargando…</span>
        )}
        {error && <span className="text-[14.5px] text-[#C56486]">{error}</span>}
        {pokemon && !loading && (
          <>
            <img
              src={pokemon.sprites.front_default}
              alt={pokemon.name}
              className="h-[110px] w-[110px]"
            />
            <span className="font-fredoka text-[20px] font-semibold text-[#3F362E]">
              #{pokemon.id} {pokemon.name}
            </span>
            <span className="text-[13px] text-[#A89A8B]">
              {pokemon.types.map((t) => t.type.name).join(" · ")}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setPokemonId((prev) => Math.max(1, prev - 1))}
          disabled={pokemonId === 1 || loading}
          className="rounded-full border-[1.5px] border-[#ECE0D0] bg-[#F4ECE1] px-5 py-2 text-[14px] font-extrabold text-[#6E6359] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          onClick={() => setPokemonId((prev) => prev + 1)}
          disabled={loading}
          className="rounded-full border-[1.5px] border-[#3F362E] bg-[#3F362E] px-5 py-2 text-[14px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
