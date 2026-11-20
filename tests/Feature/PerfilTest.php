<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PerfilTest extends TestCase
{
    public static function png(string $nome = 'foto.png'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($nome, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='));
    }

    public function test_cada_perfil_abre_o_proprio_perfil_e_troca_o_nome(): void
    {
        $admin = $this->criarAdmin();
        $this->actingAs($admin)->get(route('admin.perfil'))
            ->assertInertia(fn (Assert $p) => $p->component('perfil/Index')->where('perfil.nome', 'Professor')->where('perfil.foto', null));

        $this->actingAs($admin)->put(route('admin.perfil.update'), ['nome' => '  Coordenação  '])->assertRedirect();
        $this->assertSame('Coordenação', $admin->fresh()->nome);

        $this->flushSession();
        $usuario = $this->usuarioDa($this->criarBarraquinha());
        $this->actingAs($usuario)->get(route('barraquinha.perfil'))->assertOk();
        $this->actingAs($usuario)->get(route('admin.perfil'))->assertForbidden();
    }

    public function test_envia_troca_e_remove_a_foto(): void
    {
        Storage::fake('fotos');
        $usuario = $this->usuarioDa($this->criarBarraquinha());

        $this->actingAs($usuario)->post(route('barraquinha.perfil.foto'), ['foto' => self::png()])->assertRedirect()->assertSessionHasNoErrors();
        $primeira = $usuario->fresh()->foto_path;
        Storage::disk('fotos')->assertExists($primeira);
        $this->assertStringStartsWith('usuarios/', $primeira);
        $this->assertSame('/fotos/'.$primeira, $usuario->fresh()->fotoUrl());

        $this->actingAs($usuario)->post(route('barraquinha.perfil.foto'), ['foto' => self::png('outra.png')]);
        $segunda = $usuario->fresh()->foto_path;
        Storage::disk('fotos')->assertMissing($primeira);
        Storage::disk('fotos')->assertExists($segunda);

        $this->actingAs($usuario)->get(route('barraquinha.perfil'))
            ->assertInertia(fn (Assert $p) => $p->where('auth.usuario.foto', '/fotos/'.$segunda));

        $this->actingAs($usuario)->delete(route('barraquinha.perfil.foto.remover'))->assertRedirect();
        Storage::disk('fotos')->assertMissing($segunda);
        $this->assertNull($usuario->fresh()->foto_path);
    }

    public function test_recusa_arquivo_que_nao_e_imagem(): void
    {
        Storage::fake('fotos');
        $admin = $this->criarAdmin();

        $this->actingAs($admin)
            ->post(route('admin.perfil.foto'), ['foto' => UploadedFile::fake()->createWithContent('foto.php', '<?php echo 1;')])
            ->assertSessionHasErrors('foto');

        $this->assertNull($admin->fresh()->foto_path);
        $this->assertSame([], Storage::disk('fotos')->allFiles());
    }
}
