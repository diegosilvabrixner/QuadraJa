// admin/js/reservas.js
window.addEventListener('arenaLoaded', carregarReservas);
document.getElementById('filtroStatus')?.addEventListener('change', carregarReservas);
document.getElementById('filtroData')?.addEventListener('change', carregarReservas);

async function carregarReservas() {
  const arenaId = getArenaId();
  const status  = document.getElementById('filtroStatus')?.value || '';
  const data    = document.getElementById('filtroData')?.value || '';
  const tbody   = document.getElementById('reservasTbody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">Carregando...</td></tr>';

  try {
    let url = `/reservas?arenaId=${arenaId}&limit=50`;
    if (status) url += `&status=${status}`;
    if (data)   url += `&data=${data}`;
    const { reservas } = await api.get(url);

    if (!reservas?.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted)">Nenhuma reserva encontrada.</td></tr>';
      return;
    }

    tbody.innerHTML = reservas.map(r => {
      const dataFmt = r.data ? new Date(r.data).toLocaleDateString('pt-BR') : 'Mensal';
      const hora    = r.horaInicio ? `${r.horaInicio}–${r.horaFim||''}` : '—';
      return `
        <tr>
          <td style="font-size:11px;color:var(--text-muted)">${r.id.slice(0,8)}</td>
          <td><strong>${r.usuario?.nome||'—'}</strong><br><span style="font-size:11px;color:var(--text-muted)">${r.usuario?.telefone||''}</span></td>
          <td>${r.quadra?.codigo||'—'}</td>
          <td>${dataFmt}</td>
          <td>${hora}</td>
          <td><strong class="text-accent">${formatBRL(r.valorTotal)}</strong></td>
          <td>${badgeStatus(r.status)}</td>
          <td>
            <div style="display:flex;gap:4px">
              ${r.status==='AGUARDANDO_PAGAMENTO' ? `<button class="btn btn-secondary btn-sm" onclick="confirmarManual('${r.id}')">✓ Confirmar</button>` : ''}
              ${r.status==='CONFIRMADA' ? `<button class="btn btn-danger btn-sm" onclick="cancelarAdmin('${r.id}')">✗ Cancelar</button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    toast('Erro: ' + err.message, 'error');
  }
}

async function confirmarManual(id) {
  if (!confirm('Confirmar pagamento manualmente?')) return;
  try {
    await api.post(`/webhooks/mock-confirm/${id}`, {});
    toast('Pagamento confirmado!', 'success');
    carregarReservas();
  } catch (err) { toast(err.message, 'error'); }
}

async function cancelarAdmin(id) {
  if (!confirm('Cancelar esta reserva?')) return;
  try {
    await api.patch(`/reservas/${id}/cancelar`, { motivo: 'Cancelado pelo admin' });
    toast('Reserva cancelada.', 'success');
    carregarReservas();
  } catch (err) { toast(err.message, 'error'); }
}

window.confirmarManual = confirmarManual;
window.cancelarAdmin   = cancelarAdmin;
