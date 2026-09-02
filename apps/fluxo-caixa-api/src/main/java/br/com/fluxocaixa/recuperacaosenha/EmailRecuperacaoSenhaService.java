package br.com.fluxocaixa.recuperacaosenha;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailRecuperacaoSenhaService {

    private final JavaMailSender javaMailSender;
    private final String remetente;

    public EmailRecuperacaoSenhaService(
            JavaMailSender javaMailSender,
            @Value("${spring.mail.username}") String remetente) {

        this.javaMailSender = javaMailSender;
        this.remetente = remetente;
    }

    public void enviar(
            String destinatario,
            String nomeUsuario,
            String linkRecuperacao) {

        SimpleMailMessage mensagem = new SimpleMailMessage();

        mensagem.setFrom(remetente);
        mensagem.setTo(destinatario);
        mensagem.setSubject("Recuperação de senha");

        mensagem.setText(
                "Olá, " + nomeUsuario + ".\n\n"
                        + "Recebemos uma solicitação para redefinir "
                        + "a senha da sua conta.\n\n"
                        + "Para criar uma nova senha, acesse o link abaixo:\n\n"
                        + linkRecuperacao
                        + "\n\n"
                        + "Este link possui prazo de validade e poderá "
                        + "ser utilizado apenas uma vez.\n\n"
                        + "Se você não solicitou a recuperação de senha, "
                        + "ignore este e-mail."
        );

        javaMailSender.send(mensagem);
    }
}