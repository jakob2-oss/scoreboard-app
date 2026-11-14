/**
 * Sprüche des Otters. Drei Stufen: brav (freundlich), frech (kleine Sticheleien), atzig (cool, artsy, lässig).
 * Kurz, ohne Erklärungen; {name} ist die Person, um die es geht. Reine Daten und eine Auswahlfunktion.
 */
import type { QuipLevel } from '../lib/modes';

export type QuipEvent = 'win' | 'close' | 'blowout' | 'last' | 'roundZero' | 'kniffel' | 'verfehlt' | 'chicRohr' | 'rausgeschickt' | 'schockAus' | 'skatLost' | 'skyjoDouble';

const Q: Record<QuipEvent, Record<QuipLevel, string[]>> = {
  win: {
    brav: ['Glückwunsch, {name}!', 'Starke Partie, {name}.', 'Verdient gewonnen, {name}.'],
    frech: ['{name} gewinnt. Die anderen üben noch.', '{name} räumt ab, der Rest räumt auf.', 'Applaus für {name}. Widerwillig, aber Applaus.', '{name} gewinnt und wird es allen erzählen.'],
    atzig: ['{name}, das war Kunst.', 'Rahmt das ein: {name} hat es gemacht.', '{name} spielt auf einem anderen Level.', '{name} kam, sah und hat es einfach gemacht.', 'Museumsreif, {name}.']
  },
  close: {
    brav: ['Knapper ging es kaum.', 'Ganz knapp, aber verdient.'],
    frech: ['Knapp ist auch gewonnen. Sagt {name}.', 'Ein Punkt Vorsprung, aber {name} feiert wie zehn.'],
    atzig: ['Millimeterarbeit, {name}.', 'Auf Messers Schneide. Stilvoll, {name}.']
  },
  blowout: {
    brav: ['Ein deutlicher Sieg für {name}.'],
    frech: ['Das war keine Partie, das war eine Vorführung.', '{name} hat niemanden mitspielen lassen.'],
    atzig: ['Komplett zerlegt. Mit Stil.', '{name} hat das Spielfeld neu gestaltet.']
  },
  last: {
    brav: ['{name}, nächstes Mal klappt es.', 'Kopf hoch, {name}.'],
    frech: ['{name} hat heute großzügig verloren.', '{name}, letzter Platz ist auch ein Platz.', '{name} spielt auf Revanche.'],
    atzig: ['{name} macht kurz Pause vom Gewinnen.', 'Für {name} war es eine Performance. Titel: Verlieren.', '{name}, Underdog-Energie.']
  },
  roundZero: {
    brav: ['{name} ist raus.'],
    frech: ['{name} ist raus, der Rest zählt Strafpunkte.', '{name} legt ab. Die anderen zählen Karten.'],
    atzig: ['{name} legt ab wie ein Profi.', 'Sauber, {name}. Hand leer, Kopf frei.']
  },
  kniffel: {
    brav: ['Kniffel für {name}!'],
    frech: ['{name} würfelt Kniffel. Alle anderen: neidisch.', 'Kniffel! {name} grinst jetzt den ganzen Abend.'],
    atzig: ['Fünf gleiche. {name}, einfach wild.', '{name} würfelt Geschichte.']
  },
  verfehlt: {
    brav: ['Knapp vorbei, {name}.'],
    frech: ['{name} hat sich verzockt.', 'Zu hoch gereizt, {name}.'],
    atzig: ['{name}, hoch gepokert, tief gefallen.', 'All-in, {name}. Leider nein.']
  },
  chicRohr: {
    brav: ['{name} zahlt die Runde.'],
    frech: ['Chic aus dem Rohr! {name} zahlt, Prost.', '{name} gibt einen aus. Freiwillig war das nicht.'],
    atzig: ['{name} gibt einen aus. Ehrensache.', 'Runde auf {name}. Legendär.']
  },
  rausgeschickt: {
    brav: ['{name} ist raus.'],
    frech: ['{name} macht sich aus dem Staub.', '{name} ist raus und lacht.'],
    atzig: ['{name} verlässt die Bühne. Mit Stil.', 'Abgang {name}. Cool bleiben.']
  },
  schockAus: {
    brav: ['Schock aus für {name}.'],
    frech: ['Schock aus! {name} sammelt jetzt Deckel.', '{name} bekommt alle Deckel. Alle.'],
    atzig: ['{name}: Deckel-Sammlung komplett.', 'Schock aus. {name} trägt es mit Fassung.']
  },
  skatLost: {
    brav: ['Das ging daneben, {name}.'],
    frech: ['{name} hat sich verreizt.', 'Mutig, {name}. Aber nein.'],
    atzig: ['{name}, große Geste, kleine Ausbeute.', 'Risiko ist Kunst, {name}. Diesmal eben abstrakt.']
  },
  skyjoDouble: {
    brav: ['Doppelt für {name}.'],
    frech: ['{name} beendet und zahlt doppelt. Autsch.', 'Zu früh gefreut, {name}. Doppelt.'],
    atzig: ['{name} spielt All-in. Doppelt kassiert.', 'Mutiger Move, {name}. Teure Kunst.']
  }
};

/** Spruch für ein Ereignis; seed wählt stabil eine Variante (z. B. Partie-ID), ohne seed zufällig */
export function quip(e: QuipEvent, level: QuipLevel, name: string, seed?: string): string {
  const pool = Q[e][level];
  const i = seed === undefined ? Math.floor(Math.random() * pool.length) : [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % pool.length;
  return pool[i].replace(/\{name\}/g, name);
}
