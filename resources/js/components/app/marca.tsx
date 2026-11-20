import { cx } from "@/lib/cx";
import { useT } from "@/lib/i18n";

export function SimboloUnaerp({ className }: { className?: string }) {
    return <img src="/brand/unaerp-simbolo.png" alt="" width={71} height={71} decoding="async" className={cx("shrink-0 object-contain", className ?? "size-9")} />;
}

export function LogoUnaerpBranca({ className }: { className?: string }) {
    return <img src="/brand/unaerp-logo-branca.png" alt="UNAERP" width={95} height={106} decoding="async" className={cx("h-14 w-auto", className)} />;
}

export function Marca({ compacta, transicao, className }: { compacta?: boolean; transicao?: boolean; className?: string }) {
    const t = useT();

    return (
        <span className={cx("flex min-w-0 items-center gap-2", className)}>
            <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-xl bg-marca-fundo", transicao && "[view-transition-name:marca]")}>
                <SimboloUnaerp className="size-5" />
            </span>
            {!compacta && (
                <span className="min-w-0">
                    <span className="block text-marca font-extrabold tracking-tight whitespace-nowrap text-tinta">{t("Feira Gastronômica")}</span>
                    <span className="block text-micro font-semibold tracking-wide text-tinta-suave uppercase">UNAERP · PEG</span>
                </span>
            )}
        </span>
    );
}
