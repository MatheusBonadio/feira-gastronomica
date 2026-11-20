import { useMemo } from "react";
import { useLocale } from "@/lib/i18n";

export function paraData(valor: string): Date {
    const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
    return soData ? new Date(Number(soData[1]), Number(soData[2]) - 1, Number(soData[3])) : new Date(valor);
}

export function isoDia(data: Date): string {
    const d = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 10);
}

export function useFormato() {
    const locale = useLocale();

    return useMemo(() => {
        const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
        const moedaCompacta = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
        const inteiro = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
        const pct = new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
        const data = new Intl.DateTimeFormat(locale, { dateStyle: "short" });
        const dataHora = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" });
        const hora = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
        const diaMes = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit" });
        const diaSemana = new Intl.DateTimeFormat(locale, { weekday: "short" });
        const dataLonga = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

        return {
            locale,
            moeda: (valor: number | null | undefined) => moeda.format(valor ?? 0),
            moedaCompacta: (valor: number | null | undefined) => moedaCompacta.format(valor ?? 0),
            numero: (valor: number | null | undefined) => inteiro.format(valor ?? 0),
            percentual: (valor: number | null | undefined) => (valor === null || valor === undefined ? "-" : pct.format(valor)),
            data: (valor: string | null | undefined) => (valor ? data.format(paraData(valor)) : "-"),
            dataHora: (valor: string | null | undefined) => (valor ? dataHora.format(paraData(valor)) : "-"),
            hora: (valor: string | null | undefined) => (valor ? hora.format(paraData(valor)) : "-"),
            diaMes: (valor: string) => diaMes.format(paraData(valor)),
            diaSemana: (valor: string) => diaSemana.format(paraData(valor)).replace(".", ""),
            dataLonga: (valor: Date = new Date()) => {
                const texto = dataLonga.format(valor);
                return texto.charAt(0).toUpperCase() + texto.slice(1);
            },
        };
    }, [locale]);
}
