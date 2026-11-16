import React from "react";
import Link from "next/link";
import { MapPin, Phone, Instagram, Clock, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-dourado/30 bg-creme text-marrom">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Coluna 1: Identidade */}
          <div className="space-y-4">
            <img
              src="/images/logo-artes-em-aroma.svg"
              alt="Loja Artes em Aroma"
              className="h-12 w-auto"
            />
            <p className="text-sm leading-relaxed text-marrom/80">
              Um espaço em Suzano/SP para quem deseja transformar criatividade em produtos aromáticos, oferecendo variedade de essências, bases, ceras e atendimento próximo.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://www.instagram.com/lojartesemaroma/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-dourado/40 bg-brancoQuente px-3.5 py-1.5 text-xs font-medium text-marrom transition hover:border-oliva hover:text-oliva"
              >
                <Instagram className="h-4 w-4 text-oliva" />
                @lojartesemaroma
              </a>
            </div>
          </div>

          {/* Coluna 2: Navegação e Categorias */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-marrom">
              Catálogo &amp; Criação
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-marrom/80">
              <li>
                <Link href="/produtos?categoria=essencias-aromaticas" className="hover:text-oliva">
                  Essências Aromáticas
                </Link>
              </li>
              <li>
                <Link href="/produtos?categoria=ceras-e-velas" className="hover:text-oliva">
                  Ceras Vegetais e Pavios para Velas
                </Link>
              </li>
              <li>
                <Link href="/produtos?categoria=bases-saboaria-perfumaria" className="hover:text-oliva">
                  Base Glicerinada e Saboaria
                </Link>
              </li>
              <li>
                <Link href="/produtos?categoria=frascos-potes-acessorios" className="hover:text-oliva">
                  Frascos Âmbar, Válvulas e Potes
                </Link>
              </li>
              <li>
                <Link href="/guias" className="hover:text-oliva">
                  Guias Técnicos para Iniciantes
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Institucional */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-marrom">
              Atendimento e Dúvidas
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-marrom/80">
              <li>
                <Link href="/sobre" className="hover:text-oliva">
                  Conheça a Artes em Aroma
                </Link>
              </li>
              <li>
                <Link href="/duvidas" className="hover:text-oliva">
                  Dúvidas Frequentes (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-oliva">
                  Como Chegar em Suzano
                </Link>
              </li>
              <li>
                <Link href="/sacola" className="hover:text-oliva">
                  Minha Sacola de Solicitação
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-xs text-marrom/55 hover:text-oliva">
                  Acesso Administrativo
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Localização NAP (SEO Local Suzano) */}
          <div className="space-y-3 text-sm text-marrom/85">
            <h3 className="font-serif text-lg font-semibold text-marrom">
              Nossa Loja em Suzano
            </h3>
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-oliva" />
              <span>
                Rua Rui Barbosa, 310 — Vila Costa
                <br />
                Suzano/SP • CEP 08675-060
              </span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-oliva" />
              <span>(11) 91077-1820</span>
            </p>
            <p className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-oliva" />
              <span className="text-xs">
                Seg a Sex: 09h às 18h | Sáb: 09h às 13h (Confirmar disponibilidade no atendimento)
              </span>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-dourado/25 pt-6 text-xs text-marrom/65 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Loja Artes em Aroma — Suzano, São Paulo. Todos os direitos reservados.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-oliva" />
            Privacidade e proteção de dados (LGPD): coletamos apenas nome e contato estritamente necessários ao atendimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
