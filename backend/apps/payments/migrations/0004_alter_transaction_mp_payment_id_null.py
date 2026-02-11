# Generated manually - permite múltiples transacciones sin payment_id (NULL)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0003_alter_transaction_mp_payment_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='transaction',
            name='mp_payment_id',
            field=models.CharField(
                blank=True,
                max_length=100,
                null=True,
                unique=True,
                verbose_name='ID de pago MP',
            ),
        ),
    ]
