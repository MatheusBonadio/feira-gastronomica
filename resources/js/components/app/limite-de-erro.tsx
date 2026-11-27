import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Botao } from "@/components/ui/botao";
import { Cartao, Vazio } from "@/components/ui/cartao";

interface Props {
    /** Ao mudar (ex.: a URL da página), a tela volta a ser desenhada. */
    chave?: string;
    fallback: ReactNode;
    children: ReactNode;
}

interface Estado {
    erro: Error | null;
    chave?: string;
}

/** Erro de render não pode deixar a tela vazia: mostra o fallback e mantém o resto do app de pé. */
export class LimiteDeErro extends Component<Props, Estado> {
    state: Estado = { erro: null, chave: this.props.chave };

    static getDerivedStateFromError(erro: Error): Partial<Estado> {
        return { erro };
    }

    static getDerivedStateFromProps(props: Props, estado: Estado): Partial<Estado> | null {
        return props.chave !== estado.chave ? { erro: null, chave: props.chave } : null;
    }

    componentDidCatch(erro: Error, info: ErrorInfo) {
        console.error("[tela] erro ao desenhar", erro, info.componentStack);
    }

    render() {
        return this.state.erro ? this.props.fallback : this.props.children;
    }
}

export function FalhaNaTela({ titulo, descricao, rotuloRecarregar }: { titulo: string; descricao: string; rotuloRecarregar: string }) {
    return (
        <Cartao>
            <Vazio
                icone={IconAlertCircle}
                titulo={titulo}
                descricao={descricao}
                acao={<Botao icone={IconRefresh} onClick={() => window.location.reload()} className="max-sm:h-11">{rotuloRecarregar}</Botao>}
            />
        </Cartao>
    );
}
