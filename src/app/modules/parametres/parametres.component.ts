import { ClientService } from 'src/app/services/client.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.css']
})
export class ParametresComponent implements OnInit {
  isLoadingClients = false;
  isLoadingInvoices = false;
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
   sync(type: 'clients' | 'invoices') {
    if (type === 'clients') {
      this.isLoadingClients = true;
      this.clientservice.syncClients().subscribe({
        next: (res) => {
          this.isLoadingClients = false;
          this.message = {
            type: 'success',
            text: `Clients synchronisés : ${res.count} nouveaux clients importés.`
          };
          setTimeout(() => this.message = null, 5000);
        },
        error: (err) => {
          this.isLoadingClients = false;
          this.message = {
            type: 'error',
            text: `Erreur lors de la synchronisation des clients : ${err.error?.detail || err.message}`
          };
        }
      });
    } else {
      this.isLoadingInvoices = true;
      this.clientservice.syncInvoices().subscribe({
        next: (res) => {
          this.isLoadingInvoices = false;
          this.message = {
            type: 'success',
            text: `Factures synchronisées : ${res.count} nouvelles factures importées.`
          };
          setTimeout(() => this.message = null, 5000);
        },
        error: (err) => {
          this.isLoadingInvoices = false;
          this.message = {
            type: 'error',
            text: `Erreur lors de la synchronisation des factures : ${err.error?.detail || err.message}`
          };
        }
      });
    }
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
    if (confirm('Voulez-vous vraiment supprimer ce rôle ?')) {
      this.clientservice.deleteRole(id).subscribe({
        next: () => {
          this.showRoleMessage('success', 'Rôle supprimé avec succès');
          if (this.editingRoleId === id) this.resetRoleForm();
          this.loadRoles();
        },
        error: (err) => {
          this.showRoleMessage('error', err.error?.detail || 'Erreur lors de la suppression');
        }
      });
    }
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
