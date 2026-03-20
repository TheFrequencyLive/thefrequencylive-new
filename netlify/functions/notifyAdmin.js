const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
    // Only allow internal calls (no direct browser access)
    const internalSecret = event.headers['x-internal-secret'];
    if (internalSecret !== process.env.INTERNAL_SECRET) {
        return { statusCode: 401, body: 'Unauthorized' };
    }
    
    try {
        const data = JSON.parse(event.body);
        
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const msg = {
            to: 'admin@thefrequencylive.org',
            from: 'notifications@thefrequencylive.org',
            subject: data.subject,
            html: `
                <h3>${data.subject}</h3>
                <p><strong>From:</strong> ${data.details.name}</p>
                <p><strong>Email:</strong> ${data.details.email || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${data.details.phone || 'Not provided'}</p>
                <p><strong>Category:</strong> ${data.details.category || 'N/A'}</p>
                <hr>
                <p>${data.details.prayer || data.details.preview || ''}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                    Reply to follow up directly with this person.
                </p>
            `
        };
        
        await sgMail.send(msg);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};