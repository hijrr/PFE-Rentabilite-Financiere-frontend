import { ClientService } from 'src/app/services/client.service';
import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.css']
})
export class ParametresComponent implements OnInit {
  isLoading = false;
  message: { type: 'success' | 'error'; text: string } | null = null;
 // Propriétés pour la gestion des rôles
  roles: any[] = [];
  rolesLoading = false;
  currentRoleName = '';
   currentRoleDescription = '';
  editingRoleId: number | null = null;
  roleMessage: { type: 'success' | 'error'; text: string } | null = null;

  constructor(private clientservice:ClientService) { }

  ngOnInit(): void {
    this.loadRoles();
  }
  syncAll() {
  this.isLoading = true;

  this.clientservice.syncAll().subscribe({
    next: (res) => {
      this.isLoading = false;
      const clientsCount = res.clients.count;
      const facturesCount = res.invoices.count;
      this.message = {
        type: 'success',
        text: `Clients synchronisés : ${clientsCount} nouveaux clients importés. | Factures synchronisés  : ${facturesCount} nouveaux factures importés.`
      };

      setTimeout(() => this.message = null, 5000);
    },
    error: (err) => {
      this.isLoading = false;

      this.message = {
        type: 'error',
        text: `Erreur : ${err.error?.detail || err.message}`
      };
    }
  });
}
   // --- Gestion des rôles ---
  loadRoles() {
    this.rolesLoading = true;
    this.clientservice.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        this.rolesLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.rolesLoading = false;
        this.showRoleMessage('error', 'Erreur lors du chargement des rôles');
      }
    });
  }

   saveRole() {
    if (!this.currentRoleName.trim()) return;

    const roleData = {
      name: this.currentRoleName,
      description: this.currentRoleDescription || ''
    };

    if (this.editingRoleId) {
      this.clientservice.updateRole(this.editingRoleId, roleData).subscribe({
        next: () => {
          this.showRoleMessage('success', 'Rôle mis à jour avec succès');
          this.resetRoleForm();
          this.loadRoles();
        },
        error: (err) => {
          this.showRoleMessage('error', err.error?.detail || 'Erreur lors de la mise à jour');
        }
      });
    } else {
      this.clientservice.addRole(roleData).subscribe({
        next: () => {
          this.showRoleMessage('success', 'Rôle ajouté avec succès');
          this.resetRoleForm();
          this.loadRoles();
        },
        error: (err) => {
          this.showRoleMessage('error', err.error?.detail || 'Erreur lors de l’ajout');
        }
      });
    }
  }

  editRole(role: any) {
    this.currentRoleName = role.name;
    this.currentRoleDescription = role.description || '';
    this.editingRoleId = role.id;
  }

  cancelEdit() {
    this.resetRoleForm();
  }

 deleteRole(id: number) {
  Swal.fire({
    title: 'Supprimer ce rôle ?',
    text: "Attention : ce rôle peut être utilisé par des salariés.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Oui, supprimer',
    cancelButtonText: 'Annuler',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  }).then((result) => {
    if (result.isConfirmed) {
      this.clientservice.deleteRole(id).subscribe({
        next: () => {
          Swal.fire(
            'Supprimé !',
            'Le rôle a été supprimé avec succès.',
            'success'
          );

          if (this.editingRoleId === id) this.resetRoleForm();
          this.loadRoles();
        },
        error: (err) => {
  let message = 'Une erreur est survenue lors de la suppression.';

  // Si le statut 400 ou 409, on donne un message précis
  if (err.status === 400 || err.status === 409) {
    message = "Impossible de supprimer ce rôle : il est déjà attribué à un ou plusieurs salariés.";
  }

  // Priorité au message exact du backend
  if (err.error?.detail) {
    message = err.error.detail;
  }

  Swal.fire('Erreur', message, 'error');
}
      });
    }
  });
}

  private resetRoleForm() {
    this.currentRoleName = '';
     this.currentRoleDescription = '';
    this.editingRoleId = null;
  }

  private showRoleMessage(type: 'success' | 'error', text: string) {
    this.roleMessage = { type, text };
    setTimeout(() => this.roleMessage = null, 5000);
  }

}
