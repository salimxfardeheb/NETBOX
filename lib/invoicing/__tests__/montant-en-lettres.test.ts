import { describe, expect, it } from "vitest";
import { montantEnLettres, nombreEnLettres } from "../montant-en-lettres";

describe("nombreEnLettres", () => {
  it("écrit les petits nombres", () => {
    expect(nombreEnLettres(0)).toBe("zéro");
    expect(nombreEnLettres(7)).toBe("sept");
    expect(nombreEnLettres(16)).toBe("seize");
    expect(nombreEnLettres(17)).toBe("dix-sept");
  });

  it("gère les particularités 21–99", () => {
    expect(nombreEnLettres(21)).toBe("vingt et un");
    expect(nombreEnLettres(45)).toBe("quarante-cinq");
    expect(nombreEnLettres(70)).toBe("soixante-dix");
    expect(nombreEnLettres(71)).toBe("soixante et onze");
    expect(nombreEnLettres(77)).toBe("soixante-dix-sept");
    expect(nombreEnLettres(80)).toBe("quatre-vingts");
    expect(nombreEnLettres(81)).toBe("quatre-vingt-un");
    expect(nombreEnLettres(91)).toBe("quatre-vingt-onze");
    expect(nombreEnLettres(99)).toBe("quatre-vingt-dix-neuf");
  });

  it("accorde « cent » correctement", () => {
    expect(nombreEnLettres(100)).toBe("cent");
    expect(nombreEnLettres(101)).toBe("cent un");
    expect(nombreEnLettres(200)).toBe("deux cents");
    expect(nombreEnLettres(205)).toBe("deux cent cinq");
    expect(nombreEnLettres(999)).toBe("neuf cent quatre-vingt-dix-neuf");
  });

  it("laisse « mille » invariable et sans « un »", () => {
    expect(nombreEnLettres(1_000)).toBe("mille");
    expect(nombreEnLettres(1_001)).toBe("mille un");
    expect(nombreEnLettres(2_000)).toBe("deux mille");
    expect(nombreEnLettres(30_542)).toBe("trente mille cinq cent quarante-deux");
    // « s » supprimé devant « mille » (adjectif numéral).
    expect(nombreEnLettres(80_000)).toBe("quatre-vingt mille");
    expect(nombreEnLettres(200_000)).toBe("deux cent mille");
    // …mais conservé devant « millions » (nom).
    expect(nombreEnLettres(80_000_000)).toBe("quatre-vingts millions");
  });

  it("accorde millions et milliards", () => {
    expect(nombreEnLettres(1_000_000)).toBe("un million");
    expect(nombreEnLettres(2_000_000)).toBe("deux millions");
    expect(nombreEnLettres(1_234_567)).toBe(
      "un million deux cent trente-quatre mille cinq cent soixante-sept"
    );
    expect(nombreEnLettres(3_000_000_000)).toBe("trois milliards");
  });

  it("rejette les entrées invalides", () => {
    expect(() => nombreEnLettres(-1)).toThrow();
    expect(() => nombreEnLettres(1.5)).toThrow();
  });
});

describe("montantEnLettres", () => {
  it("écrit un montant DZD entier", () => {
    expect(montantEnLettres(1)).toBe("un dinar algérien");
    expect(montantEnLettres(11_900)).toBe(
      "onze mille neuf cents dinars algériens"
    );
  });

  it("ajoute les centimes quand ils sont non nuls", () => {
    expect(montantEnLettres(1_542.5)).toBe(
      "mille cinq cent quarante-deux dinars algériens et cinquante centimes"
    );
    expect(montantEnLettres(100.01)).toBe("cent dinars algériens et un centime");
  });

  it("arrondit au centime", () => {
    expect(montantEnLettres(10.005)).toBe(
      "dix dinars algériens et un centime"
    );
  });

  it("gère le zéro", () => {
    expect(montantEnLettres(0)).toBe("zéro dinar algérien");
  });
});
