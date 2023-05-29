const nodemailer = require('nodemailer');

const email_routes = {

    email_template: `<!doctype html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"><meta name="description" content="Email di AutoBuddy automatica"><meta name="author" content="Elia d'Albenzio"><title>Mailtemplate</title><!--<link href="mailstyle.css" rel="stylesheet" type="text/css">--><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&amp;family=Poppins:wght@700&amp;display=swap" rel="stylesheet"></head><body style="font-family: 'Inter', sans-serif;"><table class="body-wrap" style="width: 100%;cellpadding: 0;cellspacing: 0;box-sizing: border-box;font-size: 14px;margin: 0;background-color: #f5f5ff;">    <tbody>        <tr style="box-sizing: border-box;font-size: 14px;margin: 0;">            <td style="box-sizing: border-box;font-size: 14px;vertical-align: top;margin: 0;"></td>            <td class="container" style="box-sizing: border-box;font-size: 14px;vertical-align: top;margin: 0 auto;width: 600;display: block !important;max-width: 600px !important;clear: both !important;">                <div class="content" style="box-sizing: border-box;font-size: 14px;max-width: 600px;display: block;margin: 0 auto;padding: 20px;">                    <table class="main" style="width: 100%;cellpadding: 0;cellspacing: 0;box-sizing: border-box;font-size: 14px;margin: 0;border-radius: 3px;background-color: #fff;border: none;">                        <tbody>                            <tr style="box-sizing: border-box;font-size: 14px;margin: 0;">                                <td class="mainhead" style="box-sizing: border-box;font-size: 16px;vertical-align: top;margin: 0;color: #fff;font-weight: 500;text-align: center;border: none;background-color: #225AE6;padding: 20px;align: center;">                                    <a href="#" style="font-family: 'Poppins', sans-serif;font-size: 32px;color: #fff;text-decoration: none;">AutoBuddy.it</a><br>                                    <span style="margin-top: 10px;display: block;">####TEXT_REPLACE_SUBJECT####</span>                                </td>                            </tr>                            <tr style="box-sizing: border-box;font-size: 14px;margin: 0;">                                <td class="content-wrap" style="box-sizing: border-box;font-size: 14px;vertical-align: top;margin: 0;padding: 20px;">                                    <table style="width: 100%;cellpadding: 0;cellspacing: 0;box-sizing: border-box;font-size: 14px;margin: 0;">                                        <tbody>                                            <tr style="box-sizing: border-box;font-size: 14px;margin: 0;">                                                <td class="content-block" style="box-sizing: border-box;font-size: 14px;vertical-align: top;margin: 0;padding: 0 0 20px;">                                                    ####TEXT_REPLACE_HTML####                                                </td>                                            </tr>                                            <tr style="box-sizing: border-box;font-size: 14px;margin: 0;">                                                <td style="box-sizing: border-box;font-size: 14px;vertical-align: top;margin: 0;">                                                    Grazie per aver scelto <b>AutoBuddy.</b>                                                </td>                                            </tr>                                        </tbody>                                    </table>                                </td>                            </tr>                        </tbody>                    </table>                    <div class="footer" style="box-sizing: border-box;font-size: 14px;width: 100%;clear: both;color: #999;margin: 0;padding: 20px;">                        <table style="width: 100%;cellpadding: 0;cellspacing: 0;box-sizing: border-box;font-size: 14px;margin: 0;">                            <tbody>                                <tr style="box-sizing: border-box;font-size: 14px;margin: 0;">                                    <td class="aligncenter content-block" style="box-sizing: border-box;font-size: 12px;vertical-align: top;margin: 0;padding: 0 0 20px;color: #999;text-align: center;align: center;"><a href="#" style="box-sizing: border-box;font-size: 12px;color: #999;text-decoration: underline;margin: 0;">Disiscriviti</a> da questa mailing list.                                    </td>                                </tr>                            </tbody>                        </table>                    </div>                </div>            </td>            <td style="box-sizing: border-box;font-size: 14px;vertical-align: top;margin: 0;"></td>        </tr>    </tbody></table></body></html>`,

    dispatch: (request, response, send_response = true) => {

        const from      = "no-reply@autobuddy.it";
        const password  = "autobuddy**@";
        const to        = request.body.to;
        const subject   = request.body.subject;
        const text      = request.body.text_html;

        const trasport = 
            nodemailer.createTransport(
                {
                    port    : 465,
                    secure  : true,
                    host    : "smtp.ionos.it",
                    auth    : { user: from, pass: password }
                }
            );
        
        trasport.sendMail(
            {
                to      : to,
                from    : `"Autobuddy Team" ${from}`,
                subject : subject,
                html    : email_routes.email_template.split("####TEXT_REPLACE_HTML####").join(text).split("####TEXT_REPLACE_SUBJECT####").join(subject)
            }
        ).then((result) => {
            
            if(result.messageId){
                if(send_response){
                    response.json({
                        success: true,
                        data: {
                            message_id: result.messageId
                        }
                    });
                }
                return;
            }

            if(send_response){
                response.json({
                    success: false
                });
            }

        });

    }

};

exports.email_routes = email_routes;