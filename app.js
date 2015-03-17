(function() {
  return {
    doneLoading: false,
    defaultState: 'alerts',
    requests: {
      fetchUnsolvedTickets: function(email) {
        return {
          url: '/api/v2/search.json?query=status<solved requester:' + email +' type:ticket'
        };
      },
      fetchTopics: function(deal_id){
        return {
          url: '/api/v2/search.json?query='+deal_id+' type:topic'
        };
      }
    },
    events: {
      'app.activated'                   : 'activate',
      'ticket.status.changed'           : 'initializeIfReady',
      'ticket.collaborators.changed'    : 'alertOnCollaboratorPresence',
      'ticket.requester.email.changed'  : 'alertOnUnsolvedTicketPresence',
      '*.changed'                  : function(e) {
        if (e.propertyName == 'ticket.custom_field_' + this.setting('custom_field_for_deal_id'))
          return this.alertOnTopicPresence();
      },
      'click .close'                    : 'closeAlert'
    },

    activate: function(){
      services.appsTray().show();

      this.initializeIfReady();
    },

    isReady: function(){
      return(!this.doneLoading &&
             this.ticket());
    },

    initializeIfReady: function(){
      if (this.isReady()){
        this.alertOnCollaboratorPresence();
        this.alertOnUnsolvedTicketPresence();
//        this.alertOnTopicPresence();
        this.doneLoading = true;
      }
    },

    alertOnCollaboratorPresence: function(){
      var collaborators = this.ticket().collaborators(),
      collaborator_size = _.size(collaborators);

      if (collaborator_size > 0) {

        var msg = this.I18n.t('collaborators.explanation');
        msg = "<div><p style='font-size:11pt;font-weight:bold'>"+msg;

console.log( msg);
  msg = msg + "<ul>";
collaborators.forEach( function(arrayItem){
  msg = msg + "<li style='font-size:11pt;font-weight:bold'>" +arrayItem.name()+ " - " +arrayItem.email();
  console.log(arrayItem.email());
});
//console.log(collaborators.length);
msg = msg +"</div>";
services.notify(msg, 'error', 60000);

        this.renderPartial('collaborators');
        this.togglePartial('collaborators');
      } else {
        this.closeAlert({ currentTarget: 'section.collaborators .alert'});
      }
    },

    alertOnUnsolvedTicketPresence: function(){
      if (this.ticket().requester() &&
          this.ticket().requester().email()){

        this.ajax('fetchUnsolvedTickets', this.ticket().requester().email())
          .done(function(data){
            var count = data.count;

            if (!_.contains(["closed", "deleted"], this.ticket().status()))
              count -= 1;

            if (count > 0){
              var msg = this.I18n.t('unsolved_tickets.explanation', {
                count: count
              });

              msg = "<p style='font-size:11pt;font-weight:bold'>"+msg;

              msg = msg +'</br><a href="#/users/'+this.ticket().requester().id()+'">'+ this.I18n.t('unsolved_tickets.link') + '</a>';
          services.notify(msg, 'error', 60000);

              this.renderPartial('unsolved_tickets', {
                explanation: this.I18n.t('unsolved_tickets.explanation', {
                  count: count
                })
              });
              this.togglePartial('unsolved_tickets');
            }
          });
      }
    },

    alertOnTopicPresence: function(){
/*
      var deal_id = null;

      if (_.isEmpty(this.setting('custom_field_for_deal_id')) ||
          _.isEmpty(deal_id = this.ticket().customField('custom_field_' +
                                                        this.setting('custom_field_for_deal_id')))) { return; }

      this.ajax('fetchTopics', deal_id)
        .done(function(data){
          if (data.count < 1)
            return;

          this.renderPartial('topics', {
            explanation: this.I18n.t('topics.explanation', { deal_id: deal_id}),
            deal_id: deal_id,
            subdomain: this.currentAccount().subdomain()
          });
          this.togglePartial('topics');
        });
*/
    },

    closeAlert: function(e){
      this.$(e.currentTarget).parent().remove();
    },

    renderPartial: function(partial, context){
      this.$('section.' + partial).html(this.renderTemplate(partial, context));
    },

    togglePartial: function(partial){
      _.times(8, function(){
        this.$('section.' + partial).fadeToggle('slow');
      }, this);
    }
  };
}());
