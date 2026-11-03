<?php

namespace App\Enums;

enum AcaoAuditoria: string
{
    case Login = 'login';
    case LoginFalhou = 'login_falhou';
    case LoginBloqueado = 'login_bloqueado';
    case Logout = 'logout';
    case SenhaAlterada = 'senha_alterada';

    case CredencialCriada = 'credencial_criada';
    case SenhaRedefinida = 'senha_redefinida';
    case CredencialAlterada = 'credencial_alterada';
    case AcessoBloqueado = 'acesso_bloqueado';
    case AcessoReativado = 'acesso_reativado';
    case AcessoNegado = 'acesso_negado';

    case FeiraCriada = 'feira_criada';
    case FeiraAlterada = 'feira_alterada';
    case FeiraEncerrada = 'feira_encerrada';
    case FeiraReaberta = 'feira_reaberta';
    case FeiraDuplicada = 'feira_duplicada';
    case BarraquinhaAlterada = 'barraquinha_alterada';

    case ItemCriado = 'item_criado';
    case ItemAlterado = 'item_alterado';
    case ItemExcluido = 'item_excluido';
    case PrecoAlterado = 'preco_alterado';
    case ComboCriado = 'combo_criado';
    case ComboAlterado = 'combo_alterado';
    case ComboExcluido = 'combo_excluido';

    case VendaRegistrada = 'venda_registrada';
    case VendaCancelada = 'venda_cancelada';
    case LancamentoCriado = 'lancamento_criado';
    case LancamentoAlterado = 'lancamento_alterado';
    case LancamentoExcluido = 'lancamento_excluido';

    case Exportacao = 'exportacao';

    public function label(): string
    {
        return match ($this) {
            self::Login => __('Entrou no sistema'),
            self::LoginFalhou => __('Tentativa de login falhou'),
            self::LoginBloqueado => __('Login bloqueado por tentativas'),
            self::Logout => __('Saiu do sistema'),
            self::SenhaAlterada => __('Alterou a própria senha'),
            self::CredencialCriada => __('Criou credenciais'),
            self::SenhaRedefinida => __('Redefiniu a senha'),
            self::CredencialAlterada => __('Alterou usuário e senha'),
            self::AcessoBloqueado => __('Bloqueou o acesso'),
            self::AcessoReativado => __('Reativou o acesso'),
            self::AcessoNegado => __('Acesso negado'),
            self::FeiraCriada => __('Criou a feira'),
            self::FeiraAlterada => __('Alterou a feira'),
            self::FeiraEncerrada => __('Encerrou a feira'),
            self::FeiraReaberta => __('Reabriu a feira'),
            self::FeiraDuplicada => __('Duplicou a feira'),
            self::BarraquinhaAlterada => __('Alterou a barraquinha'),
            self::ItemCriado => __('Cadastrou item'),
            self::ItemAlterado => __('Alterou item'),
            self::ItemExcluido => __('Excluiu item'),
            self::PrecoAlterado => __('Alterou preço'),
            self::ComboCriado => __('Cadastrou combo'),
            self::ComboAlterado => __('Alterou combo'),
            self::ComboExcluido => __('Excluiu combo'),
            self::VendaRegistrada => __('Registrou venda'),
            self::VendaCancelada => __('Cancelou venda'),
            self::LancamentoCriado => __('Criou lançamento'),
            self::LancamentoAlterado => __('Alterou lançamento'),
            self::LancamentoExcluido => __('Excluiu lançamento'),
            self::Exportacao => __('Exportou relatório'),
        };
    }

    public function sensivel(): bool
    {
        return in_array($this, [
            self::LoginFalhou, self::LoginBloqueado, self::AcessoNegado,
            self::SenhaRedefinida, self::CredencialAlterada, self::AcessoBloqueado,
            self::VendaCancelada,
        ], true);
    }
}
