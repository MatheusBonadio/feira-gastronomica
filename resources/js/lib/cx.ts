/** Junta classes condicionais. Sem tailwind-merge: os componentes evitam classes conflitantes. */
export function cx(...classes: (string | false | null | undefined | 0)[]): string {
    return classes.filter(Boolean).join(" ");
}
